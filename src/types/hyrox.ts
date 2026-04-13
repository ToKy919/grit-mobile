/**
 * GRIT — Hyrox Data Models
 */

export type HyroxStationId =
  | "run1" | "skiErg" | "run2" | "sledPush"
  | "run3" | "sledPull" | "run4" | "burpeeBroadJump"
  | "run5" | "rowing" | "run6" | "farmersCarry"
  | "run7" | "sandbagLunges" | "run8" | "wallBalls";

export interface HyroxStationDef {
  id: HyroxStationId;
  name: string;
  detail: string;
  isRun: boolean;
}

export interface HyroxStationResult {
  stationDef: HyroxStationDef;
  status: "pending" | "active" | "transition" | "completed";
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  transitionMs?: number;
}

export const HYROX_STATIONS: HyroxStationDef[] = [
  { id: "run1", name: "RUN 1", detail: "1 KM", isRun: true },
  { id: "skiErg", name: "SKI ERG", detail: "1000M", isRun: false },
  { id: "run2", name: "RUN 2", detail: "1 KM", isRun: true },
  { id: "sledPush", name: "SLED PUSH", detail: "50M", isRun: false },
  { id: "run3", name: "RUN 3", detail: "1 KM", isRun: true },
  { id: "sledPull", name: "SLED PULL", detail: "50M", isRun: false },
  { id: "run4", name: "RUN 4", detail: "1 KM", isRun: true },
  { id: "burpeeBroadJump", name: "BURPEE BROAD JUMP", detail: "80M", isRun: false },
  { id: "run5", name: "RUN 5", detail: "1 KM", isRun: true },
  { id: "rowing", name: "ROWING", detail: "1000M", isRun: false },
  { id: "run6", name: "RUN 6", detail: "1 KM", isRun: true },
  { id: "farmersCarry", name: "FARMERS CARRY", detail: "200M", isRun: false },
  { id: "run7", name: "RUN 7", detail: "1 KM", isRun: true },
  { id: "sandbagLunges", name: "SANDBAG LUNGES", detail: "100M", isRun: false },
  { id: "run8", name: "RUN 8", detail: "1 KM", isRun: true },
  { id: "wallBalls", name: "WALL BALLS", detail: "75 REPS", isRun: false },
];
