/**
 * GRIT — Math Utilities
 * Pure functions for GPS calculations and stats
 */

import type { TrackPoint } from "../types/gps";

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

/**
 * Haversine formula — distance between two GPS coordinates in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Calculate pace in seconds per kilometer
 */
export function calculatePace(distanceM: number, durationMs: number): number {
  if (distanceM <= 0) return 0;
  return (durationMs / 1000) * (1000 / distanceM);
}

/**
 * Smoothed speed using moving average over last N points
 */
export function smoothSpeed(
  points: TrackPoint[],
  windowSize: number = 5
): number {
  if (points.length < 2) return 0;

  const window = points.slice(-windowSize);
  if (window.length < 2) return 0;

  const first = window[0];
  const last = window[window.length - 1];
  const dist = haversineDistance(
    first.latitude,
    first.longitude,
    last.latitude,
    last.longitude
  );
  const dt = (last.timestamp - first.timestamp) / 1000;

  if (dt <= 0) return 0;
  return dist / dt; // m/s
}

/**
 * Calculate total elevation gain (only positive changes)
 */
export function calculateElevationGain(points: TrackPoint[]): number {
  let gain = 0;
  let prevAlt: number | null = null;

  for (const p of points) {
    if (p.altitude === null) continue;
    if (prevAlt !== null) {
      const diff = p.altitude - prevAlt;
      if (diff > 0.5) {
        // Threshold to reduce GPS altitude noise
        gain += diff;
      }
    }
    prevAlt = p.altitude;
  }

  return gain;
}

/**
 * Validate a GPS track point — reject impossible jumps
 */
export function isValidPoint(
  point: { latitude: number; longitude: number; accuracy: number; timestamp: number; speed: number | null },
  prevPoint: TrackPoint | null
): boolean {
  // Reject very inaccurate readings
  if (point.accuracy > 30) return false;

  if (!prevPoint) return true;

  const dist = haversineDistance(
    prevPoint.latitude,
    prevPoint.longitude,
    point.latitude,
    point.longitude
  );
  const dt = (point.timestamp - prevPoint.timestamp) / 1000;

  if (dt <= 0) return false;

  const impliedSpeed = dist / dt;
  // Reject teleportation (> 15 m/s = 54 km/h, impossible for running)
  if (impliedSpeed > 15) return false;

  return true;
}

/**
 * Determine GPS signal quality from accuracy
 */
export function getSignalQuality(
  accuracy: number
): "searching" | "weak" | "good" | "excellent" {
  if (accuracy > 30) return "searching";
  if (accuracy > 15) return "weak";
  if (accuracy > 5) return "good";
  return "excellent";
}

/**
 * Calculate standard deviation (for consistency metrics)
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(
    squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1)
  );
}
