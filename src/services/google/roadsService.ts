/**
 * GRIT — Google Roads API Service
 *
 * Snap-to-road: Corrects GPS drift by snapping points to nearest road.
 * Dramatically improves accuracy in urban areas with tall buildings.
 * Processes in batches of 100 points (API limit).
 */

import { GOOGLE_API_KEY, GOOGLE_BASE_URLS } from "./config";
import type { TrackPoint } from "../../types/gps";

interface SnappedPoint {
  location: {
    latitude: number;
    longitude: number;
  };
  originalIndex: number;
  placeId: string;
}

interface SnapToRoadsResponse {
  snappedPoints: SnappedPoint[];
  warningMessage?: string;
}

/**
 * Snap GPS track points to the nearest road.
 * Batches into groups of 100 (API limit).
 * Returns corrected coordinates.
 */
export async function snapToRoads(
  points: TrackPoint[]
): Promise<TrackPoint[]> {
  if (!GOOGLE_API_KEY || points.length < 2) return points;

  try {
    const batches: TrackPoint[][] = [];
    for (let i = 0; i < points.length; i += 100) {
      batches.push(points.slice(i, i + 100));
    }

    const snappedAll: TrackPoint[] = [];

    for (const batch of batches) {
      const path = batch
        .map((p) => `${p.latitude},${p.longitude}`)
        .join("|");

      const url = `${GOOGLE_BASE_URLS.roads}/snapToRoads?path=${path}&interpolate=true&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 403) {
          console.info("[Roads] API not enabled. Enable 'Roads API' at https://console.cloud.google.com/apis/library/roads.googleapis.com — using raw GPS data instead");
        } else {
          console.warn("[Roads] API error:", response.status);
        }
        return points; // fallback to original — don't try remaining batches
      }

      const data: SnapToRoadsResponse = await response.json();

      if (data.snappedPoints && data.snappedPoints.length > 0) {
        // Map snapped coordinates back to TrackPoints
        for (const snapped of data.snappedPoints) {
          const originalIdx = snapped.originalIndex;
          if (originalIdx !== undefined && originalIdx < batch.length) {
            const original = batch[originalIdx];
            snappedAll.push({
              ...original,
              latitude: snapped.location.latitude,
              longitude: snapped.location.longitude,
            });
          }
        }
      } else {
        snappedAll.push(...batch);
      }
    }

    return snappedAll;
  } catch (error) {
    console.warn("[Roads] Snap to roads failed:", error);
    return points; // fallback to original
  }
}

/**
 * Get speed limit for a given location (if available).
 * Returns speed in km/h or null.
 */
export async function getSpeedLimit(
  latitude: number,
  longitude: number
): Promise<number | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const url = `${GOOGLE_BASE_URLS.roads}/speedLimits?path=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.speedLimits && data.speedLimits.length > 0) {
      return data.speedLimits[0].speedLimit; // km/h
    }
    return null;
  } catch {
    return null;
  }
}
