/**
 * GRIT — GPS / Location Data Models
 */

export interface TrackPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  timestamp: number;
  distanceFromPrevM: number;
}

export interface Split {
  kmIndex: number;
  durationMs: number;
  paceSecPerKm: number;
  avgSpeedMs: number;
  elevationChangeM: number;
  startTimestamp: number;
  endTimestamp: number;
}

export type GpsSignalQuality = "searching" | "weak" | "good" | "excellent";

export interface GpsState {
  isTracking: boolean;
  hasPermission: boolean | null;
  signalQuality: GpsSignalQuality;
  currentPoint: TrackPoint | null;
  trackPoints: TrackPoint[];
  totalDistanceM: number;
  currentPaceSecPerKm: number;
  avgPaceSecPerKm: number;
  currentSplitDistanceM: number;
  currentSplitStartTime: number;
  elevationGainM: number;
  splits: Split[];
  currentSpeed: number;
}

export const initialGpsState: GpsState = {
  isTracking: false,
  hasPermission: null,
  signalQuality: "searching",
  currentPoint: null,
  trackPoints: [],
  totalDistanceM: 0,
  currentPaceSecPerKm: 0,
  avgPaceSecPerKm: 0,
  currentSplitDistanceM: 0,
  currentSplitStartTime: 0,
  elevationGainM: 0,
  splits: [],
  currentSpeed: 0,
};
