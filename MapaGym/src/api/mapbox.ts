import axios from 'axios';

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

export const fetchShadowGyms = async (
  latitude: number,
  longitude: number
): Promise<ShadowGym[]> => {
  try {
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

    console.log("🔎 Searching OpenStreetMap (Overpass)...");

    // 3. SEND REQUEST TO OVERPASS INTERPRETER
    const response = await axios.post<OverpassResponse>(
      'https://overpass-api.de/api/interpreter',
      query,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    const data = response.data.elements;
    console.log(`✅ Overpass found ${data.length} potential gyms.`);

    // 4. FORMAT RESULTS
    const shadowGyms: ShadowGym[] = data.map((place: OverpassElement) => ({
      _id: `osm-${place.id}`,
      name: place.tags.name || "Unknown Gym",
      description: "Unverified Location - Scout to claim!",
      location: {
        coordinates: [
          place.center ? place.center.lon : place.lon!,
          place.center ? place.center.lat : place.lat!
        ] as [number, number],
      },
      isShadow: true,
      tags: place.tags
    }));

    // Filter out unnamed gyms to keep the map clean
    return shadowGyms.filter(g => g.name !== "Unknown Gym");

  } catch (error) {
    console.error("❌ Error fetching Overpass gyms:", error);
    return [];
  }
};