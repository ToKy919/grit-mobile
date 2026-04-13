/**
 * GRIT — Storage Service
 * AsyncStorage wrapper with typed keys and crash recovery
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TrackPoint } from "../../types/gps";

export const STORAGE_KEYS = {
  WORKOUT_HISTORY: "@grit/workout_history",
  USER_PROFILE: "@grit/user_profile",
  APP_SETTINGS: "@grit/app_settings",
  PERSONAL_RECORDS: "@grit/personal_records",
  ACTIVE_SESSION_BACKUP: "@grit/active_session_backup",
  TRACK_POINTS_BUFFER: "@grit/track_points_buffer",
  SCHEMA_VERSION: "@grit/schema_version",
} as const;

/**
 * Save active session backup for crash recovery
 */
export async function saveSessionBackup(session: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACTIVE_SESSION_BACKUP,
      JSON.stringify(session)
    );
  } catch (e) {
    console.warn("[Storage] Failed to save session backup:", e);
  }
}

/**
 * Load active session backup (returns null if none)
 */
export async function loadSessionBackup(): Promise<unknown | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_BACKUP);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn("[Storage] Failed to load session backup:", e);
    return null;
  }
}

/**
 * Clear active session backup (after successful save or discard)
 */
export async function clearSessionBackup(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_BACKUP);
    await AsyncStorage.removeItem(STORAGE_KEYS.TRACK_POINTS_BUFFER);
  } catch (e) {
    console.warn("[Storage] Failed to clear session backup:", e);
  }
}

/**
 * Persist track points buffer (crash safety — every 10 points)
 */
export async function saveTrackPointsBuffer(
  points: TrackPoint[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.TRACK_POINTS_BUFFER,
      JSON.stringify(points)
    );
  } catch (e) {
    console.warn("[Storage] Failed to save track points buffer:", e);
  }
}

/**
 * Load track points buffer after crash
 */
export async function loadTrackPointsBuffer(): Promise<TrackPoint[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRACK_POINTS_BUFFER);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("[Storage] Failed to load track points buffer:", e);
    return [];
  }
}
