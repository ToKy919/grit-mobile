/**
 * GRIT — Google API Configuration
 * Key loaded from .env (NEVER hardcoded, NEVER committed)
 */

export const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "";

if (!GOOGLE_API_KEY) {
  console.warn("[Google] No API key found. Set EXPO_PUBLIC_GOOGLE_API_KEY in .env");
}

export const GOOGLE_BASE_URLS = {
  roads: "https://roads.googleapis.com/v1",
  airQuality: "https://airquality.googleapis.com/v1",
  pollen: "https://pollen.googleapis.com/v1",
  elevation: "https://maps.googleapis.com/maps/api/elevation",
  geocoding: "https://maps.googleapis.com/maps/api/geocode",
} as const;
