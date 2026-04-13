/**
 * GRIT — Montage Builder
 * Converts a RunSession (mobile) to MontageInput (server) format.
 * Simplifies track points, selects relevant data.
 */

import type { RunSession, WodSession, HyroxSession, WorkoutSession } from "../../types/workout";

// Mirror of the server's MontageInput type
export interface MontageInput {
  workout: {
    id: string;
    type: "run" | "wod" | "hyrox";
    totalDurationMs: number;
    startedAt: number;
    locationName?: string;
  };
  run?: {
    totalDistanceM: number;
    avgPaceSecPerKm: number;
    elevationGainM: number;
    splits: Array<{ kmIndex: number; paceSecPerKm: number }>;
    routePoints: Array<{ lat: number; lng: number }>;
  };
  wod?: {
    timerMode: string;
    totalReps: number;
  };
  hyrox?: {
    stations: Array<{ name: string; durationMs: number }>;
  };
  template: "highlight" | "story";
  personalRecords?: string[];
}

/**
 * Build a MontageInput from a completed workout session.
 * Downsamples route points for efficient transfer.
 */
export function buildMontageInput(
  session: WorkoutSession,
  template: "highlight" | "story" = "highlight",
  personalRecords: string[] = []
): MontageInput {
  const input: MontageInput = {
    workout: {
      id: session.id,
      type: session.type,
      totalDurationMs: session.totalDurationMs,
      startedAt: session.startedAt,
      locationName: session.notes,
    },
    template,
    personalRecords,
  };

  if (session.type === "run") {
    const run = session as RunSession;
    // Downsample route points (keep every Nth point, max 200)
    const step = Math.max(1, Math.floor(run.trackPoints.length / 200));
    const routePoints = run.trackPoints
      .filter((_, i) => i % step === 0)
      .map((p) => ({ lat: p.latitude, lng: p.longitude }));

    input.run = {
      totalDistanceM: run.totalDistanceM,
      avgPaceSecPerKm: run.avgPaceSecPerKm,
      elevationGainM: run.elevationGainM,
      splits: run.splits.map((s) => ({
        kmIndex: s.kmIndex,
        paceSecPerKm: s.paceSecPerKm,
      })),
      routePoints,
    };
  }

  if (session.type === "wod") {
    const wod = session as WodSession;
    input.wod = {
      timerMode: wod.timerMode,
      totalReps: wod.totalReps,
    };
  }

  if (session.type === "hyrox") {
    const hyrox = session as HyroxSession;
    input.hyrox = {
      stations: hyrox.stations
        .filter((s) => s.durationMs !== undefined)
        .map((s) => ({
          name: s.stationDef.name,
          durationMs: s.durationMs!,
        })),
    };
  }

  return input;
}
