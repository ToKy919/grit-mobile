/**
 * GRIT — Google Pollen API Service
 *
 * Real-time pollen data for outdoor athletes.
 * Critical for runners with allergies — can decide whether to run outdoor or indoor.
 * Shows grass, tree, and weed pollen levels with risk assessment.
 */

import { GOOGLE_API_KEY, GOOGLE_BASE_URLS } from "./config";

export interface PollenType {
  name: string;
  code: string;
  /** Index 0-5 (0=none, 5=very high) */
  index: number;
  /** Human readable level */
  level: "None" | "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  /** Color for UI */
  color: string;
  /** Top allergens in this category */
  allergens: string[];
}

export interface PollenData {
  /** Overall pollen risk (max of all types) */
  overallIndex: number;
  overallLevel: string;
  overallColor: string;
  /** Individual pollen types */
  types: PollenType[];
  /** Should the athlete be warned? */
  isHighRisk: boolean;
  /** Recommendation */
  recommendation: string;
  /** Date of the data */
  date: string;
}

/**
 * Fetch current pollen data for a location
 */
export async function getPollenData(
  latitude: number,
  longitude: number
): Promise<PollenData | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const url = `${GOOGLE_BASE_URLS.pollen}/forecast:lookup?key=${GOOGLE_API_KEY}&location.latitude=${latitude}&location.longitude=${longitude}&days=1&languageCode=fr`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 403) {
        console.info("[Pollen] API not enabled. Enable 'Pollen API' at https://console.cloud.google.com/apis/library/pollen.googleapis.com");
      }
      return null;
    }

    const data = await response.json();

    if (!data.dailyInfo || data.dailyInfo.length === 0) return null;

    const today = data.dailyInfo[0];
    const types: PollenType[] = [];
    let maxIndex = 0;

    // Process each pollen type
    if (today.pollenTypeInfo) {
      for (const info of today.pollenTypeInfo) {
        const index = info.indexInfo?.value ?? 0;
        const level = indexToLevel(index);

        types.push({
          name: info.displayName || info.code,
          code: info.code,
          index,
          level,
          color: getPollenColor(index),
          allergens: (info.healthRecommendations || []).slice(0, 2),
        });

        if (index > maxIndex) maxIndex = index;
      }
    }

    // Process plant info if available
    if (today.plantInfo) {
      for (const plant of today.plantInfo) {
        const index = plant.indexInfo?.value ?? 0;
        if (index > maxIndex) maxIndex = index;
      }
    }

    return {
      overallIndex: maxIndex,
      overallLevel: indexToLevel(maxIndex),
      overallColor: getPollenColor(maxIndex),
      types,
      isHighRisk: maxIndex >= 3,
      recommendation: getPollenRecommendation(maxIndex),
      date: today.date ? `${today.date.year}-${today.date.month}-${today.date.day}` : new Date().toISOString().split("T")[0],
    };
  } catch (error) {
    console.warn("[Pollen] Fetch failed:", error);
    return null;
  }
}

function indexToLevel(index: number): PollenType["level"] {
  if (index <= 0) return "None";
  if (index <= 1) return "Very Low";
  if (index <= 2) return "Low";
  if (index <= 3) return "Moderate";
  if (index <= 4) return "High";
  return "Very High";
}

function getPollenColor(index: number): string {
  if (index <= 0) return "#22C55E";
  if (index <= 1) return "#86EFAC";
  if (index <= 2) return "#EFFF00";
  if (index <= 3) return "#F59E0B";
  if (index <= 4) return "#EF4444";
  return "#DC2626";
}

function getPollenRecommendation(index: number): string {
  if (index <= 1) return "Low pollen. Great conditions for outdoor training";
  if (index <= 2) return "Moderate pollen. Sensitive athletes should take antihistamines before running";
  if (index <= 3) return "High pollen. Consider indoor training if you have allergies";
  if (index <= 4) return "Very high pollen. Indoor training strongly recommended for allergy sufferers";
  return "Extreme pollen levels. Avoid outdoor activity if you have any respiratory sensitivity";
}
