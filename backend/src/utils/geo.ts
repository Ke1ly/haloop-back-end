import { GeocodeResult } from "../types/Utils.js";

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=zh-TW`;

  const response = await fetch(url);
  const data = (await response.json()) as { results: any[] };

  if (!data.results || data.results.length === 0) {
    console.warn(`Geocoding failed for: ${address}`);
    return {
      latitude: null,
      longitude: null,
      city: null,
      district: null,
    };
  }

  const result = data.results[0];

  const lat = result.geometry.lat;
  const lng = result.geometry.lng;
  const components = result.components;

  return {
    latitude: lat,
    longitude: lng,
    city: components.city || components.county || components.town,
    district:
      components.city_district || components.suburb || components.village,
  };
}
