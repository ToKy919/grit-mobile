/**
 * GRIT — useGpsTracking Hook
 * Connects LocationService to RunTrackerStore
 */

import { useRef, useCallback, useEffect } from "react";
import { LocationService } from "../services/gps/locationService";
import { useRunTrackerStore } from "../stores/useRunTrackerStore";

export function useGpsTracking() {
  const serviceRef = useRef<LocationService>(new LocationService());

  const isTracking = useRunTrackerStore((s) => s.isTracking);
  const hasPermission = useRunTrackerStore((s) => s.hasPermission);
  const onLocationUpdate = useRunTrackerStore((s) => s.onLocationUpdate);
  const setPermission = useRunTrackerStore((s) => s.setPermission);
  const startTracking = useRunTrackerStore((s) => s.startTracking);
  const stopTracking = useRunTrackerStore((s) => s.stopTracking);
  const reset = useRunTrackerStore((s) => s.reset);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serviceRef.current.stop();
    };
  }, []);

  /**
   * Request GPS permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await serviceRef.current.requestPermissions();
    setPermission(granted);
    return granted;
  }, [setPermission]);

  /**
   * Start GPS tracking — requests permissions if needed, starts location service
   */
  const start = useCallback(async (): Promise<boolean> => {
    let permission = hasPermission;

    if (permission === null || permission === false) {
      permission = await requestPermission();
    }

    if (!permission) return false;

    // Reset store state for new run
    startTracking();

    // Start GPS service
    await serviceRef.current.start((coords) => {
      onLocationUpdate(coords);
    });

    return true;
  }, [hasPermission, requestPermission, startTracking, onLocationUpdate]);

  /**
   * Stop GPS tracking
   */
  const stop = useCallback(() => {
    serviceRef.current.stop();
    stopTracking();
  }, [stopTracking]);

  return {
    isTracking,
    hasPermission,
    start,
    stop,
    reset,
    requestPermission,
  };
}
