/**
 * GRIT — useGpsTracking Hook
 * Connects LocationService to RunTrackerStore
 */

import { useRef, useCallback, useEffect } from "react";
import { LocationService } from "../services/gps/locationService";
import { useRunTrackerStore } from "../stores/useRunTrackerStore";

export function useGpsTracking() {
  const serviceRef = useRef<LocationService>(new LocationService());
  const store = useRunTrackerStore();

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
    store.setPermission(granted);
    return granted;
  }, []);

  /**
   * Start GPS tracking
   */
  const start = useCallback(async (): Promise<boolean> => {
    let permission = useRunTrackerStore.getState().hasPermission;

    if (permission === null || permission === false) {
      permission = await requestPermission();
    }

    if (!permission) return false;

    store.startTracking();

    await serviceRef.current.start((coords) => {
      useRunTrackerStore.getState().onLocationUpdate(coords);
    });

    return true;
  }, [requestPermission]);

  /**
   * Stop GPS tracking
   */
  const stop = useCallback(() => {
    serviceRef.current.stop();
    store.stopTracking();
  }, []);

  return {
    isTracking: store.isTracking,
    hasPermission: store.hasPermission,
    start,
    stop,
    reset: store.reset,
    requestPermission,
  };
}
