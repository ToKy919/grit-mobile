/**
 * GRIT — Run Tracker Store
 * GPS-specific live state. Separate store to avoid re-rendering non-GPS UI.
 */

import { create } from "zustand";
import type { TrackPoint, Split, GpsState } from "../types/gps";
import { initialGpsState } from "../types/gps";
import {
  haversineDistance,
  calculatePace,
  smoothSpeed,
  calculateElevationGain,
  isValidPoint,
  getSignalQuality,
} from "../utils/math";
import { saveTrackPointsBuffer } from "../services/persistence/storageService";

interface RunTrackerState extends GpsState {
  onLocationUpdate: (coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    speed: number | null;
    timestamp: number;
  }) => void;
  startTracking: () => void;
  stopTracking: () => void;
  reset: () => void;
  setPermission: (granted: boolean) => void;
}

export const useRunTrackerStore = create<RunTrackerState>()((set, get) => ({
  ...initialGpsState,

  setPermission: (granted: boolean) => {
    set({ hasPermission: granted });
  },

  startTracking: () => {
    set({
      ...initialGpsState,
      isTracking: true,
      hasPermission: get().hasPermission,
      currentSplitStartTime: Date.now(),
    });
  },

  stopTracking: () => {
    set({ isTracking: false });
  },

  reset: () => {
    set(initialGpsState);
  },

  onLocationUpdate: (coords) => {
    const state = get();
    if (!state.isTracking) return;

    const prevPoint = state.currentPoint;
    const timestamp = coords.timestamp || Date.now();

    // Validate point
    if (
      !isValidPoint(
        { ...coords, timestamp },
        prevPoint
      )
    ) {
      // Update signal quality even for rejected points
      set({ signalQuality: getSignalQuality(coords.accuracy) });
      return;
    }

    // Calculate distance from previous point
    let distanceFromPrev = 0;
    if (prevPoint) {
      distanceFromPrev = haversineDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        coords.latitude,
        coords.longitude
      );
    }

    const newPoint: TrackPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      timestamp,
      distanceFromPrevM: distanceFromPrev,
    };

    const newTrackPoints = [...state.trackPoints, newPoint];
    const newTotalDistance = state.totalDistanceM + distanceFromPrev;
    const newSplitDistance = state.currentSplitDistanceM + distanceFromPrev;

    // Calculate current speed (smoothed)
    const currentSpeed = smoothSpeed(newTrackPoints, 5);

    // Calculate current pace
    const currentPace =
      currentSpeed > 0.3 ? 1000 / currentSpeed : 0;

    // Calculate avg pace
    const totalTimeMs = timestamp - (state.trackPoints[0]?.timestamp || timestamp);
    const avgPace = calculatePace(newTotalDistance, totalTimeMs);

    // Elevation gain
    const elevationGain = calculateElevationGain(newTrackPoints);

    // Signal quality
    const signalQuality = getSignalQuality(coords.accuracy);

    // Check for split (every 1000m)
    let newSplits = state.splits;
    let splitDistance = newSplitDistance;
    let splitStartTime = state.currentSplitStartTime;

    if (newSplitDistance >= 1000) {
      const splitDuration = timestamp - state.currentSplitStartTime;
      const split: Split = {
        kmIndex: state.splits.length + 1,
        durationMs: splitDuration,
        paceSecPerKm: splitDuration / 1000,
        avgSpeedMs: 1000 / (splitDuration / 1000),
        elevationChangeM: 0, // simplified for now
        startTimestamp: state.currentSplitStartTime,
        endTimestamp: timestamp,
      };
      newSplits = [...state.splits, split];
      splitDistance = newSplitDistance - 1000;
      splitStartTime = timestamp;
    }

    set({
      currentPoint: newPoint,
      trackPoints: newTrackPoints,
      totalDistanceM: newTotalDistance,
      currentSplitDistanceM: splitDistance,
      currentSplitStartTime: splitStartTime,
      currentPaceSecPerKm: currentPace,
      avgPaceSecPerKm: avgPace,
      elevationGainM: elevationGain,
      signalQuality,
      currentSpeed,
      splits: newSplits,
    });

    // Crash safety: persist every 10 points
    if (newTrackPoints.length % 10 === 0) {
      saveTrackPointsBuffer(newTrackPoints);
    }
  },
}));
