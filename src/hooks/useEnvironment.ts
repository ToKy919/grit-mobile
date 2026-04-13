/**
 * GRIT — useEnvironment Hook
 *
 * Fetches air quality + pollen data for current location.
 * Refreshes every 15 minutes during a run (data doesn't change fast).
 * Shows environmental conditions to the athlete.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getAirQuality, AirQualityData } from "../services/google/airQualityService";
import { getPollenData, PollenData } from "../services/google/pollenService";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export interface EnvironmentData {
  airQuality: AirQualityData | null;
  pollen: PollenData | null;
  isLoading: boolean;
  lastUpdated: number | null;
  /** Combined safety assessment */
  overallSafe: boolean;
  /** Combined warning message (if any) */
  warning: string | null;
}

export function useEnvironment() {
  const [data, setData] = useState<EnvironmentData>({
    airQuality: null,
    pollen: null,
    isLoading: false,
    lastUpdated: null,
    overallSafe: true,
    warning: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEnvironment = useCallback(async (lat: number, lon: number) => {
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      const [airQuality, pollen] = await Promise.all([
        getAirQuality(lat, lon),
        getPollenData(lat, lon),
      ]);

      // Assess overall safety
      const aqiSafe = !airQuality || airQuality.safeToRun;
      const pollenSafe = !pollen || !pollen.isHighRisk;
      const overallSafe = aqiSafe && pollenSafe;

      // Build warning message
      let warning: string | null = null;
      if (!aqiSafe && airQuality) {
        warning = airQuality.recommendation;
      }
      if (!pollenSafe && pollen) {
        const pollenMsg = pollen.recommendation;
        warning = warning ? `${warning}. ${pollenMsg}` : pollenMsg;
      }

      setData({
        airQuality,
        pollen,
        isLoading: false,
        lastUpdated: Date.now(),
        overallSafe,
        warning,
      });
    } catch (error) {
      console.warn("[Environment] Fetch failed:", error);
      setData((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Start monitoring environmental conditions.
   * Fetches immediately, then every 15 min.
   */
  const startMonitoring = useCallback(
    (lat: number, lon: number) => {
      // Fetch immediately
      fetchEnvironment(lat, lon);

      // Refresh periodically
      intervalRef.current = setInterval(() => {
        fetchEnvironment(lat, lon);
      }, REFRESH_INTERVAL_MS);
    },
    [fetchEnvironment]
  );

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...data,
    fetchEnvironment,
    startMonitoring,
    stopMonitoring,
  };
}
