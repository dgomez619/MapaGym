import axios from 'axios';

const SHADOW_CACHE_TTL_MS = 60_000;
const OVERPASS_RETRY_DELAY_MS = 2_000;
const OVERPASS_COOLDOWN_MS = 45_000;

const shadowGymsCache = new Map<string, { at: number; data: ShadowGym[] }>();
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
  tags: {
    name?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface ShadowGym {
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

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getLocationCacheKey = (latitude: number, longitude: number) => {
  const latBucket = latitude.toFixed(3);
  const lngBucket = longitude.toFixed(3);
  return `${latBucket}:${lngBucket}`;
};

const formatShadowGyms = (data: OverpassElement[]): ShadowGym[] => {
  const shadowGyms: ShadowGym[] = data.map((place: OverpassElement) => ({
    _id: `osm-${place.id}`,
    name: place.tags.name || 'Unknown Gym',
    description: 'Unverified Location - Scout to claim!',
    location: {
      coordinates: [
        place.center ? place.center.lon : place.lon!,
        place.center ? place.center.lat : place.lat!,
      ] as [number, number],
    },
    isShadow: true,
    tags: place.tags,
  }));

  return shadowGyms.filter((gym) => gym.name !== 'Unknown Gym');
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

  if (now < overpassCooldownUntil) {
    const waitMs = overpassCooldownUntil - now;
    console.warn('[Overpass] cooldown active, skipping remote call', {
      waitMs,
      cacheKey,
      hasCached: Boolean(cached),
    });
    return cached?.data ?? [];
  }

  try {
    const startedAt = performance.now();
    const timeoutMs = options?.timeoutMs ?? 10000;

    // 1. DEFINE THE SEARCH RADIUS (Meters)
    const radius = 5000; // 5km (approx 3 miles)

    // 2. CONSTRUCT THE OVERPASS QUERY
    const query = `
      [out:json];
      (
        node["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
        way["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
        node["sport"="fitness"](around:${radius},${latitude},${longitude});
        way["sport"="fitness"](around:${radius},${latitude},${longitude});
      );
      out center 20; 
    `;

    console.log('🔎 Searching OpenStreetMap (Overpass)...', {
      latitude,
      longitude,
      timeoutMs,
      at: new Date().toISOString(),
    });

    const requestOverpass = () =>
      axios.post<OverpassResponse>('https://overpass-api.de/api/interpreter', query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: timeoutMs,
      });

    let response;
    try {
      response = await requestOverpass();
    } catch (firstError) {
      if (!axios.isAxiosError(firstError) || firstError.response?.status !== 429) {
        throw firstError;
      }

      console.warn('[Overpass] 429 received, retrying once after backoff', {
        delayMs: OVERPASS_RETRY_DELAY_MS,
      });
      await sleep(OVERPASS_RETRY_DELAY_MS);

      try {
        response = await requestOverpass();
      } catch (retryError) {
        if (axios.isAxiosError(retryError) && retryError.response?.status === 429) {
          overpassCooldownUntil = Date.now() + OVERPASS_COOLDOWN_MS;
          console.warn('[Overpass] 429 persisted, entering cooldown', {
            cooldownMs: OVERPASS_COOLDOWN_MS,
            until: new Date(overpassCooldownUntil).toISOString(),
          });
          return cached?.data ?? [];
        }
        throw retryError;
      }
    }

    const data = response.data.elements;
    console.log('✅ Overpass done', {
      count: data.length,
      tookMs: Math.round(performance.now() - startedAt),
    });

    const shadowGyms = formatShadowGyms(data);
    shadowGymsCache.set(cacheKey, { at: Date.now(), data: shadowGyms });
    return shadowGyms;

  } catch (error) {
    console.error('❌ Error fetching Overpass gyms:', error);
    return cached?.data ?? [];
  }
};