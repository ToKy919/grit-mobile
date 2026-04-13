/**
 * GRIT — Workout Data Models
 */

export type WorkoutType = "run" | "wod" | "hyrox";
export type WorkoutStatus = "active" | "paused" | "completed" | "discarded";
export type TimerMode = "amrap" | "emom" | "forTime" | "tabata" | "stopwatch";

export interface PauseEvent {
  pausedAt: number;
  resumedAt?: number;
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  status: WorkoutStatus;
  startedAt: number;
  endedAt?: number;
  totalDurationMs: number;
  pauseEvents: PauseEvent[];
  notes?: string;
}

export interface TimerConfig {
  mode: TimerMode;
  durationSec?: number;
  intervalSec?: number;
  workSec?: number;
  restSec?: number;
  rounds?: number;
}

export interface RoundData {
  roundNumber: number;
  durationMs: number;
  reps?: number;
  completedAt: number;
}

export interface RunSession extends WorkoutSession {
  type: "run";
  trackPoints: import("./gps").TrackPoint[];
  splits: import("./gps").Split[];
  totalDistanceM: number;
  elevationGainM: number;
  avgPaceSecPerKm: number;
}

export interface WodSession extends WorkoutSession {
  type: "wod";
  timerMode: TimerMode;
  timerConfig: TimerConfig;
  rounds: RoundData[];
  totalReps: number;
}

export interface HyroxSession extends WorkoutSession {
  type: "hyrox";
  stations: import("./hyrox").HyroxStationResult[];
  currentStationIndex: number;
}
