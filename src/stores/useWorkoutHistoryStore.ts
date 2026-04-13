/**
 * GRIT — Workout History Store
 * No persist middleware (incompatible with React 19).
 * Manual save/load via AsyncStorage.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WorkoutSession, RunSession } from "../types/workout";
import type { PersonalRecord } from "../types/user";

const STORAGE_KEY = "@grit/workout_history";

interface WorkoutHistoryState {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  _loaded: boolean;

  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  loadFromStorage: () => Promise<void>;
}

export const useWorkoutHistoryStore = create<WorkoutHistoryState>()((set, get) => ({
  sessions: [],
  personalRecords: [],
  _loaded: false,

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          sessions: data.sessions || [],
          personalRecords: data.personalRecords || [],
          _loaded: true,
        });
      } else {
        set({ _loaded: true });
      }
    } catch (e) {
      console.warn("[History] Failed to load:", e);
      set({ _loaded: true });
    }
  },

  addSession: (session: WorkoutSession) => {
    const state = get();
    const sessions = [session, ...state.sessions];
    const personalRecords = [...state.personalRecords];

    // Auto-detect PRs for run sessions
    if (session.type === "run") {
      const run = session as RunSession;
      const checkPR = (category: string, minDist: number, maxDist: number) => {
        if (run.totalDistanceM >= minDist && run.totalDistanceM <= maxDist) {
          const existing = personalRecords.find((p) => p.category === category);
          if (!existing || run.totalDurationMs < existing.value) {
            const pr: PersonalRecord = { category, value: run.totalDurationMs, unit: "time", achievedAt: session.startedAt, sessionId: session.id };
            const idx = personalRecords.findIndex((p) => p.category === category);
            if (idx >= 0) personalRecords[idx] = pr;
            else personalRecords.push(pr);
          }
        }
      };
      checkPR("5K RUN", 4900, 5200);
      checkPR("10K RUN", 9800, 10200);
    }

    if (session.type === "hyrox") {
      const existing = personalRecords.find((p) => p.category === "HYROX SIM");
      if (!existing || session.totalDurationMs < existing.value) {
        const pr: PersonalRecord = { category: "HYROX SIM", value: session.totalDurationMs, unit: "time", achievedAt: session.startedAt, sessionId: session.id };
        const idx = personalRecords.findIndex((p) => p.category === "HYROX SIM");
        if (idx >= 0) personalRecords[idx] = pr;
        else personalRecords.push(pr);
      }
    }

    set({ sessions, personalRecords });

    // Persist async (fire and forget)
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, personalRecords })).catch((e) =>
      console.warn("[History] Failed to save:", e)
    );
  },

  deleteSession: (id: string) => {
    const sessions = get().sessions.filter((s) => s.id !== id);
    set({ sessions });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, personalRecords: get().personalRecords })).catch(() => {});
  },
}));
