/**
 * GRIT — Google Air Quality API Service
 *
 * Real-time air quality data for the runner's location.
 * Shows AQI, dominant pollutant, and health recommendations.
 * Critical for outdoor athletes — trains in bad air = performance loss + health risk.
 */

import { GOOGLE_API_KEY, GOOGLE_BASE_URLS } from "./config";

export interface AirQualityData {
  /** Universal AQI (1-500+) */
  aqi: number;
  /** Category label */
  category: "Good" | "Moderate" | "Unhealthy for Sensitive" | "Unhealthy" | "Very Unhealthy" | "Hazardous";
  /** Dominant pollutant */
  dominantPollutant: string;
  /** Color for UI (hex) */
  color: string;
  /** Health recommendation for athletes */
  recommendation: string;
  /** Is it safe to run? */
  safeToRun: boolean;
}

/**
 * Fetch current air quality for a location
 */
export async function getAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityData | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const url = `${GOOGLE_BASE_URLS.airQuality}/currentConditions:lookup?key=${GOOGLE_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { latitude, longitude },
        universalAqi: true,
        extraComputations: [
          "HEALTH_RECOMMENDATIONS",
          "DOMINANT_POLLUTANT_CONCENTRATION",
        ],
        languageCode: "fr",
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.info("[AirQuality] API not enabled. Enable 'Air Quality API' at https://console.cloud.google.com/apis/library/airquality.googleapis.com");
      }
      return null;
    }

    const data = await response.json();

    if (!data.indexes || data.indexes.length === 0) return null;

    // Find Universal AQI index
    const uaqi = data.indexes.find((idx: any) => idx.code === "uaqi") || data.indexes[0];
    const aqi = uaqi.aqi || 0;

    return {
      aqi,
      category: categorizeAqi(aqi),
      dominantPollutant: uaqi.dominantPollutant || "UNKNOWN",
      color: getAqiColor(aqi),
      recommendation: getAthleteRecommendation(aqi),
      safeToRun: aqi <= 100,
    };
  } catch (error) {
    console.warn("[AirQuality] Fetch failed:", error);
    return null;
  }
}

function categorizeAqi(aqi: number): AirQualityData["category"] {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#22C55E";   // green
  if (aqi <= 100) return "#EFFF00";  // yellow (GRIT accent)
  if (aqi <= 150) return "#F59E0B";  // orange
  if (aqi <= 200) return "#EF4444";  // red
  if (aqi <= 300) return "#8B5CF6";  // purple
  return "#7F1D1D";                   // maroon
}

function getAthleteRecommendation(aqi: number): string {
  if (aqi <= 50) return "Perfect conditions for high-intensity training";
  if (aqi <= 100) return "Good for training. Sensitive athletes may reduce intensity";
  if (aqi <= 150) return "Reduce outdoor intensity. Consider indoor alternatives";
  if (aqi <= 200) return "Avoid outdoor high-intensity. Indoor training recommended";
  if (aqi <= 300) return "Do not train outdoors. Indoor only";
  return "Stay indoors. No physical activity recommended";
}
