import axios from 'axios';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SHADOW_CACHE_TTL_MS = 60_000;
const OVERPASS_COOLDOWN_MS = 45_000;

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

const shadowGymsCache = new Map<string, { at: number; data: ShadowGym[] }>();
const inFlightRequests = new Map<string, Promise<ShadowGym[]>>();
let overpassCooldownUntil = 0;

// TYPES
interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface ShadowGym {
  _id: string;
  name: string;
  description: string;
  location: {
    coordinates: [number, number];
  };
  isShadow: boolean;
  tags?: {
    [key: string]: string | undefined;
  };
}

const getLocationCacheKey = (latitude: number, longitude: number) => {
  const latBucket = latitude.toFixed(3);
  const lngBucket = longitude.toFixed(3);
  return `${latBucket}:${lngBucket}`;
};

const formatShadowGyms = (data: OverpassElement[]): ShadowGym[] => {
  const shadowGyms: ShadowGym[] = data
    .map((place: OverpassElement) => {
      const lon = place.center ? place.center.lon : place.lon;
      const lat = place.center ? place.center.lat : place.lat;
      if (typeof lon !== 'number' || typeof lat !== 'number') return null;

      return {
        _id: `osm-${place.id}`,
        name: place.tags?.name || 'Unknown Gym',
        description: 'Unverified Location - Scout to claim!',
        location: {
          coordinates: [lon, lat] as [number, number],
        },
        isShadow: true,
        tags: place.tags,
      };
    })
    .filter((gym): gym is NonNullable<typeof gym> => gym !== null && gym.name !== 'Unknown Gym');

  return shadowGyms;
};

/**
 * Fallback to Mapbox Search Box / Geocoding API when Overpass servers are unreachable or time out.
 */
const fetchMapboxFallbackGyms = async (
  latitude: number,
  longitude: number,
  timeoutMs: number
): Promise<ShadowGym[]> => {
  if (!MAPBOX_TOKEN) return [];

  try {
    const startedAt = performance.now();
    // Try Mapbox Search Box v1 Category API for fitness_center
    const searchBoxUrl = `https://api.mapbox.com/search/searchbox/v1/category/fitness_center?proximity=${longitude},${latitude}&limit=20&access_token=${MAPBOX_TOKEN}`;
    const res = await axios.get(searchBoxUrl, { timeout: timeoutMs });
    const features = res.data?.features;

    if (Array.isArray(features) && features.length > 0) {
      const gyms: ShadowGym[] = features
        .map((f: any): ShadowGym | null => {
          const coords = f.geometry?.coordinates;
          const props = f.properties || {};
          if (!Array.isArray(coords) || coords.length < 2 || !props.name) return null;
          return {
            _id: `mbx-${props.mapbox_id || f.id || `${coords[0]}-${coords[1]}`}`,
            name: props.name,
            description: props.full_address || props.place_formatted || 'Unverified Location - Scout to claim!',
            location: {
              coordinates: [coords[0], coords[1]] as [number, number],
            },
            isShadow: true,
            tags: {
              name: props.name,
              phone: props.metadata?.phone,
              website: props.metadata?.website,
            },
          };
        })
        .filter((g: ShadowGym | null): g is ShadowGym => g !== null);

      console.log('✅ Mapbox POI fallback done', {
        count: gyms.length,
        tookMs: Math.round(performance.now() - startedAt),
      });
      return gyms;
    }
  } catch (err) {
    console.warn('[Mapbox Fallback] SearchBox category failed, trying Geocoding v5 POI:', err instanceof Error ? err.message : String(err));
  }

  try {
    const startedAt = performance.now();
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/gym.json?proximity=${longitude},${latitude}&types=poi&limit=10&access_token=${MAPBOX_TOKEN}`;
    const res = await axios.get(geocodingUrl, { timeout: timeoutMs });
    const features = res.data?.features || [];
    const gyms: ShadowGym[] = features
      .map((f: any): ShadowGym | null => {
        const coords = f.center || f.geometry?.coordinates;
        const name = f.text || f.place_name?.split(',')[0];
        if (!Array.isArray(coords) || coords.length < 2 || !name) return null;
        return {
          _id: `mbx-${f.id}`,
          name,
          description: 'Unverified Location - Scout to claim!',
          location: {
            coordinates: [coords[0], coords[1]] as [number, number],
          },
          isShadow: true,
          tags: {
            name,
            phone: f.properties?.tel,
          },
        };
      })
      .filter((g: ShadowGym | null): g is ShadowGym => g !== null);

    console.log('✅ Mapbox Geocoding v5 fallback done', {
      count: gyms.length,
      tookMs: Math.round(performance.now() - startedAt),
    });
    return gyms;
  } catch (err) {
    console.error('❌ Mapbox fallback also failed:', err);
    return [];
  }
};

export const fetchShadowGyms = async (
  latitude: number,
  longitude: number,
  options?: { timeoutMs?: number }
): Promise<ShadowGym[]> => {
  const cacheKey = getLocationCacheKey(latitude, longitude);
  const now = Date.now();
  const cached = shadowGymsCache.get(cacheKey);

  if (cached && now - cached.at < SHADOW_CACHE_TTL_MS) {
    console.log('[Overpass] cache hit', { cacheKey, count: cached.data.length });
    return cached.data;
  }

  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight) {
    console.log('[Overpass] joining in-flight request', { cacheKey });
    return existingInFlight;
  }

  const requestPromise = (async (): Promise<ShadowGym[]> => {
    const startedAt = performance.now();
    const perEndpointTimeoutMs = Math.min(options?.timeoutMs ?? 4500, 4500);

    // Use a fast bounding box (~5km around lat/lng) instead of 4 slow `around:5000` scans
    const latDelta = 0.045; // ~5km
    const lngDelta = 0.045 / Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
    const south = (latitude - latDelta).toFixed(5);
    const west = (longitude - lngDelta).toFixed(5);
    const north = (latitude + latDelta).toFixed(5);
    const east = (longitude + lngDelta).toFixed(5);

    const query = `[out:json][timeout:4][bbox:${south},${west},${north},${east}];(nwr["leisure"="fitness_centre"];nwr["sport"="fitness"];);out center 25;`;

    if (now >= overpassCooldownUntil) {
      console.log('🔎 Searching OpenStreetMap (Overpass)...', {
        latitude,
        longitude,
        timeoutMs: perEndpointTimeoutMs,
        at: new Date().toISOString(),
      });

      try {
        // Race Overpass mirrors in parallel so one slow/blocked mirror doesn't stall for 20+ seconds
        const winner = await Promise.any(
          OVERPASS_ENDPOINTS.map(async (endpoint) => {
            const response = await axios.post<OverpassResponse>(endpoint, `data=${encodeURIComponent(query)}`, {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              timeout: perEndpointTimeoutMs,
            });
            const data = response.data?.elements;
            if (!Array.isArray(data)) {
              throw new Error(`Invalid Overpass response from ${endpoint}`);
            }
            return { endpoint, data };
          })
        );

        console.log('✅ Overpass done', {
          endpoint: winner.endpoint,
          count: winner.data.length,
          tookMs: Math.round(performance.now() - startedAt),
        });

        const shadowGyms = formatShadowGyms(winner.data);
        if (shadowGyms.length > 0) {
          shadowGymsCache.set(cacheKey, { at: Date.now(), data: shadowGyms });
          return shadowGyms;
        }
      } catch (aggregateErr) {
        overpassCooldownUntil = Date.now() + OVERPASS_COOLDOWN_MS;
        console.warn('⚠️ Overpass mirrors unreachable/timed out, falling back to Mapbox POI search', {
          tookMs: Math.round(performance.now() - startedAt),
          cooldownMs: OVERPASS_COOLDOWN_MS,
        });
      }
    } else {
      console.log('[Overpass] cooldown active, using Mapbox POI fallback directly');
    }

    const fallbackGyms = await fetchMapboxFallbackGyms(latitude, longitude, 5000);
    if (fallbackGyms.length > 0) {
      shadowGymsCache.set(cacheKey, { at: Date.now(), data: fallbackGyms });
      return fallbackGyms;
    }

    return cached?.data ?? [];
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};