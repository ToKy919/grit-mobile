/**
 * GRIT — Adaptive GPS Frequency
 * Battery optimization: adjust polling based on current speed
 */

export interface GpsConfig {
  timeInterval: number;     // ms between updates
  distanceInterval: number; // meters between updates
}

/**
 * Get GPS polling config based on current speed.
 *
 * Standing:   5s / 5m   → minimal battery usage
 * Walking:    3s / 5m   → reasonable accuracy
 * Running:    1s / 3m   → high accuracy for pace/splits
 * Sprinting:  500ms / 2m → maximum accuracy
 */
export function getAdaptiveConfig(speedMs: number): GpsConfig {
  if (speedMs < 1) {
    return { timeInterval: 5000, distanceInterval: 5 };
  }
  if (speedMs < 3) {
    return { timeInterval: 3000, distanceInterval: 5 };
  }
  if (speedMs < 6) {
    return { timeInterval: 1000, distanceInterval: 3 };
  }
  return { timeInterval: 500, distanceInterval: 2 };
}
