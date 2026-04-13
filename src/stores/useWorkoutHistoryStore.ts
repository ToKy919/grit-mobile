/**
 * GRIT — Workout History Store
 * Persisted with AsyncStorage. All completed sessions.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WorkoutSession, RunSession } from "../types/workout";
import type { PersonalRecord } from "../types/user";
import { STORAGE_KEYS } from "../services/persistence/storageService";

interface WorkoutHistoryState {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];

  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  getSessionsByType: (type: string) => WorkoutSession[];
}

export const useWorkoutHistoryStore = create<WorkoutHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      personalRecords: [],

      addSession: (session: WorkoutSession) => {
        set((state) => {
          const sessions = [session, ...state.sessions];
          const personalRecords = [...state.personalRecords];

          // Auto-detect PRs for run sessions
          if (session.type === "run") {
            const run = session as RunSession;
            if (run.totalDistanceM >= 4900 && run.totalDistanceM <= 5200) {
              // ~5K
              const existing = personalRecords.find((p) => p.category === "5K RUN");
              if (!existing || run.totalDurationMs < existing.value) {
                const pr: PersonalRecord = {
                  category: "5K RUN",
                  value: run.totalDurationMs,
                  unit: "time",
                  achievedAt: session.startedAt,
                  sessionId: session.id,
                };
                const idx = personalRecords.findIndex((p) => p.category === "5K RUN");
                if (idx >= 0) personalRecords[idx] = pr;
                else personalRecords.push(pr);
              }
            }
            if (run.totalDistanceM >= 9800 && run.totalDistanceM <= 10200) {
              // ~10K
              const existing = personalRecords.find((p) => p.category === "10K RUN");
              if (!existing || run.totalDurationMs < existing.value) {
                const pr: PersonalRecord = {
                  category: "10K RUN",
                  value: run.totalDurationMs,
                  unit: "time",
                  achievedAt: session.startedAt,
                  sessionId: session.id,
                };
                const idx = personalRecords.findIndex((p) => p.category === "10K RUN");
                if (idx >= 0) personalRecords[idx] = pr;
                else personalRecords.push(pr);
              }
            }
          }

          // PR for Hyrox total time
          if (session.type === "hyrox") {
            const existing = personalRecords.find((p) => p.category === "HYROX SIM");
            if (!existing || session.totalDurationMs < existing.value) {
              const pr: PersonalRecord = {
                category: "HYROX SIM",
                value: session.totalDurationMs,
                unit: "time",
                achievedAt: session.startedAt,
                sessionId: session.id,
              };
              const idx = personalRecords.findIndex((p) => p.category === "HYROX SIM");
              if (idx >= 0) personalRecords[idx] = pr;
              else personalRecords.push(pr);
            }
          }

          return { sessions, personalRecords };
        });
      },

      deleteSession: (id: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      getSessionsByType: (type: string) => {
        return get().sessions.filter((s) => s.type === type);
      },
    }),
    {
      name: STORAGE_KEYS.WORKOUT_HISTORY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
