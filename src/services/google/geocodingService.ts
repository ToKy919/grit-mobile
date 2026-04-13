/**
 * GRIT — Google Geocoding Service
 * Converts GPS coordinates to human-readable location name.
 * Used for: "Run in Parc de la Tête d'Or, Lyon" in session history.
 */

import { GOOGLE_API_KEY, GOOGLE_BASE_URLS } from "./config";

export interface LocationName {
  /** Short name (e.g., "Parc de la Tête d'Or") */
  shortName: string;
  /** City */
  city: string;
  /** Full address */
  fullAddress: string;
}

/**
 * Reverse geocode: coordinates → location name
 */
export async function getLocationName(
  latitude: number,
  longitude: number
): Promise<LocationName | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const url = `${GOOGLE_BASE_URLS.geocoding}/json?latlng=${latitude},${longitude}&language=fr&result_type=neighborhood|park|locality&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== "OK" || !data.results?.length) return null;

    const result = data.results[0];

    // Extract city from address components
    let city = "";
    let neighborhood = "";
    for (const component of result.address_components || []) {
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
      if (
        component.types.includes("neighborhood") ||
        component.types.includes("park") ||
        component.types.includes("sublocality_level_1")
      ) {
        neighborhood = component.long_name;
      }
    }

    return {
      shortName: neighborhood || city || "Unknown",
      city: city || "Unknown",
      fullAddress: result.formatted_address || "",
    };
  } catch (error) {
    console.warn("[Geocoding] Fetch failed:", error);
    return null;
  }
}
