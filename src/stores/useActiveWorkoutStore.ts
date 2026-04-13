/**
 * GRIT — Active Workout Store
 * Manages the live workout session. NOT persisted (memory only).
 * Writes crash recovery backup every 30s.
 */

import { create } from "zustand";
import type { WorkoutSession, WorkoutType, PauseEvent } from "../types/workout";
import { generateId } from "../utils/idGenerator";
import { saveSessionBackup, clearSessionBackup } from "../services/persistence/storageService";

interface ActiveWorkoutState {
  session: WorkoutSession | null;
  isActive: boolean;
  isPaused: boolean;
  elapsedMs: number;

  startWorkout: (type: WorkoutType) => WorkoutSession;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  updateElapsed: (ms: number) => void;
  completeWorkout: () => WorkoutSession | null;
  discardWorkout: () => void;
  restoreSession: (session: WorkoutSession) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()((set, get) => ({
  session: null,
  isActive: false,
  isPaused: false,
  elapsedMs: 0,

  startWorkout: (type: WorkoutType) => {
    const session: WorkoutSession = {
      id: generateId(),
      type,
      status: "active",
      startedAt: Date.now(),
      totalDurationMs: 0,
      pauseEvents: [],
    };

    set({ session, isActive: true, isPaused: false, elapsedMs: 0 });
    saveSessionBackup(session);
    return session;
  },

  pauseWorkout: () => {
    const { session } = get();
    if (!session || session.status !== "active") return;

    const pauseEvent: PauseEvent = { pausedAt: Date.now() };
    const updated: WorkoutSession = {
      ...session,
      status: "paused",
      pauseEvents: [...session.pauseEvents, pauseEvent],
    };

    set({ session: updated, isPaused: true });
    saveSessionBackup(updated);
  },

  resumeWorkout: () => {
    const { session } = get();
    if (!session || session.status !== "paused") return;

    const pauseEvents = [...session.pauseEvents];
    const lastPause = pauseEvents[pauseEvents.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      pauseEvents[pauseEvents.length - 1] = {
        ...lastPause,
        resumedAt: Date.now(),
      };
    }

    const updated: WorkoutSession = {
      ...session,
      status: "active",
      pauseEvents,
    };

    set({ session: updated, isPaused: false });
    saveSessionBackup(updated);
  },

  updateElapsed: (ms: number) => {
    set({ elapsedMs: ms });

    // Backup every ~30 seconds (300 ticks at 100ms)
    const { session } = get();
    if (session && ms > 0 && Math.floor(ms / 30000) !== Math.floor((ms - 100) / 30000)) {
      saveSessionBackup({ ...session, totalDurationMs: ms });
    }
  },

  completeWorkout: () => {
    const { session, elapsedMs } = get();
    if (!session) return null;

    const completed: WorkoutSession = {
      ...session,
      status: "completed",
      endedAt: Date.now(),
      totalDurationMs: elapsedMs,
    };

    set({ session: null, isActive: false, isPaused: false, elapsedMs: 0 });
    clearSessionBackup();
    return completed;
  },

  discardWorkout: () => {
    set({ session: null, isActive: false, isPaused: false, elapsedMs: 0 });
    clearSessionBackup();
  },

  restoreSession: (session: WorkoutSession) => {
    set({
      session,
      isActive: true,
      isPaused: session.status === "paused",
      elapsedMs: session.totalDurationMs,
    });
  },
}));
