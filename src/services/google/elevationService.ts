/**
 * GRIT — Google Elevation API Service
 *
 * More accurate elevation than phone GPS barometer.
 * Phone altitude can drift ±10-30m. Google Elevation API is ±1m.
 * Used post-run to correct elevation profile.
 */

import { GOOGLE_API_KEY, GOOGLE_BASE_URLS } from "./config";
import type { TrackPoint } from "../../types/gps";

interface ElevationResult {
  elevation: number;
  resolution: number;
  location: { lat: number; lng: number };
}

/**
 * Get precise elevation for track points.
 * Batches into groups of 256 locations (API limit per request).
 * Returns corrected TrackPoints with accurate altitude.
 */
export async function getElevations(
  points: TrackPoint[]
): Promise<TrackPoint[]> {
  if (!GOOGLE_API_KEY || points.length === 0) return points;

  try {
    // Sample points to reduce API calls (every 5th point)
    const sampleRate = Math.max(1, Math.floor(points.length / 200));
    const sampledIndices: number[] = [];
    for (let i = 0; i < points.length; i += sampleRate) {
      sampledIndices.push(i);
    }
    // Always include last point
    if (sampledIndices[sampledIndices.length - 1] !== points.length - 1) {
      sampledIndices.push(points.length - 1);
    }

    const sampledPoints = sampledIndices.map((i) => points[i]);

    // Batch into groups of 256
    const correctedPoints = [...points];
    const batches: { indices: number[]; pts: TrackPoint[] }[] = [];

    for (let i = 0; i < sampledPoints.length; i += 256) {
      batches.push({
        indices: sampledIndices.slice(i, i + 256),
        pts: sampledPoints.slice(i, i + 256),
      });
    }

    for (const batch of batches) {
      const locations = batch.pts
        .map((p) => `${p.latitude},${p.longitude}`)
        .join("|");

      const url = `${GOOGLE_BASE_URLS.elevation}/json?locations=${encodeURIComponent(locations)}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.status !== "OK" || !data.results) continue;

      // Apply corrected elevations
      for (let j = 0; j < data.results.length; j++) {
        const result: ElevationResult = data.results[j];
        const originalIndex = batch.indices[j];
        if (originalIndex < correctedPoints.length) {
          correctedPoints[originalIndex] = {
            ...correctedPoints[originalIndex],
            altitude: result.elevation,
          };
        }
      }
    }

    // Interpolate elevations for non-sampled points
    for (let i = 0; i < correctedPoints.length; i++) {
      if (correctedPoints[i].altitude === null) {
        // Find nearest sampled points before and after
        let prevIdx = -1;
        let nextIdx = -1;
        for (const si of sampledIndices) {
          if (si <= i) prevIdx = si;
          if (si >= i && nextIdx === -1) nextIdx = si;
        }
        if (prevIdx >= 0 && nextIdx >= 0 && prevIdx !== nextIdx) {
          const prevAlt = correctedPoints[prevIdx].altitude ?? 0;
          const nextAlt = correctedPoints[nextIdx].altitude ?? 0;
          const ratio = (i - prevIdx) / (nextIdx - prevIdx);
          correctedPoints[i] = {
            ...correctedPoints[i],
            altitude: prevAlt + (nextAlt - prevAlt) * ratio,
          };
        }
      }
    }

    return correctedPoints;
  } catch (error) {
    console.warn("[Elevation] Fetch failed:", error);
    return points;
  }
}
