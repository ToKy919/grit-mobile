/**
 * GRIT — User & Settings Data Models
 */

export interface UserProfile {
  name: string;
  createdAt: number;
  units: "metric" | "imperial";
}

export interface PersonalRecord {
  category: string;
  value: number;
  unit: "time" | "reps" | "distance";
  achievedAt: number;
  sessionId: string;
}

export interface AppSettings {
  autoPauseEnabled: boolean;
  autoPauseSpeedThreshold: number; // m/s
  hapticFeedbackEnabled: boolean;
  keepScreenOn: boolean;
  gpsAccuracy: "high" | "balanced";
  countdownBeepEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoPauseEnabled: true,
  autoPauseSpeedThreshold: 0.5,
  hapticFeedbackEnabled: true,
  keepScreenOn: true,
  gpsAccuracy: "high",
  countdownBeepEnabled: true,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  createdAt: Date.now(),
  units: "metric",
};
