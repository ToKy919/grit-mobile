/**
 * GRIT — Timer Modes
 *
 * Each mode wraps TimerEngine and adds mode-specific logic:
 * - Stopwatch: counts up, no auto-end
 * - AMRAP: counts DOWN from duration, alerts at 0
 * - EMOM: counts within intervals, resets each round
 * - For Time: counts UP, user presses done, optional cap
 * - Tabata: alternates work/rest for N rounds
 */

import type { TimerMode, TimerConfig } from "../../types/workout";
import { TimerEngine } from "./timerEngine";
import { hapticService } from "../haptics/hapticService";

export type TimerPhase = "work" | "rest" | "transition" | "countdown" | "finished";

export interface TimerDisplay {
  /** Formatted time to show on screen */
  timeMs: number;
  /** Current phase */
  phase: TimerPhase;
  /** Current round (1-based) */
  round: number;
  /** Total rounds (if applicable) */
  totalRounds?: number;
  /** Total elapsed since start */
  totalElapsedMs: number;
  /** Reps counted */
  reps: number;
  /** Is the timer done? */
  isFinished: boolean;
}

export type TimerDisplayCallback = (display: TimerDisplay) => void;

export class TimerModeController {
  private engine: TimerEngine;
  private config: TimerConfig;
  private onUpdate: TimerDisplayCallback;
  private round: number = 1;
  private reps: number = 0;
  private lastPhase: TimerPhase = "work";
  private isFinished: boolean = false;
  private lastRoundAlertAt: number = 0;

  constructor(config: TimerConfig, onUpdate: TimerDisplayCallback) {
    this.engine = new TimerEngine();
    this.config = config;
    this.onUpdate = onUpdate;
  }

  start(): void {
    this.round = 1;
    this.reps = 0;
    this.isFinished = false;
    this.lastRoundAlertAt = 0;

    this.engine.start((elapsedMs) => {
      this.processMode(elapsedMs);
    });
  }

  pause(): void {
    this.engine.pause();
  }

  resume(): void {
    this.engine.resume();
  }

  stop(): number {
    return this.engine.stop();
  }

  logRep(): void {
    this.reps++;
    hapticService.light();
    this.emitCurrent();
  }

  nextRound(): void {
    this.round++;
    hapticService.roundComplete();
    this.emitCurrent();
  }

  get isPaused(): boolean {
    return this.engine.isPaused;
  }

  get isRunning(): boolean {
    return this.engine.isRunning;
  }

  destroy(): void {
    this.engine.destroy();
  }

  // ─── Mode Processing ──────────────────────────────

  private processMode(elapsedMs: number): void {
    switch (this.config.mode) {
      case "stopwatch":
        this.processStopwatch(elapsedMs);
        break;
      case "amrap":
        this.processAmrap(elapsedMs);
        break;
      case "emom":
        this.processEmom(elapsedMs);
        break;
      case "forTime":
        this.processForTime(elapsedMs);
        break;
      case "tabata":
        this.processTabata(elapsedMs);
        break;
    }
  }

  private processStopwatch(elapsedMs: number): void {
    this.emit(elapsedMs, "work", this.round, undefined, elapsedMs);
  }

  private processAmrap(elapsedMs: number): void {
    const capMs = (this.config.durationSec || 600) * 1000;
    const remaining = Math.max(0, capMs - elapsedMs);

    // Countdown alerts at 10s, 3s, 2s, 1s
    const remainingSec = Math.ceil(remaining / 1000);
    if (remainingSec <= 3 && remainingSec > 0 && remaining > 0) {
      this.alertOnce(remainingSec, () => hapticService.countdown());
    }

    if (remaining <= 0 && !this.isFinished) {
      this.isFinished = true;
      hapticService.workoutFinished();
      this.emit(0, "finished", this.round, undefined, elapsedMs);
      this.engine.stop();
      return;
    }

    this.emit(remaining, "work", this.round, undefined, elapsedMs);
  }

  private processEmom(elapsedMs: number): void {
    const intervalMs = (this.config.intervalSec || 60) * 1000;
    const totalRounds = this.config.rounds || 10;

    const currentRound = Math.min(Math.floor(elapsedMs / intervalMs) + 1, totalRounds);
    const timeInRound = elapsedMs % intervalMs;
    const remaining = intervalMs - timeInRound;

    // Alert on round change
    if (currentRound !== this.round) {
      this.round = currentRound;
      hapticService.roundComplete();
    }

    // Finished
    if (currentRound >= totalRounds && timeInRound >= intervalMs) {
      if (!this.isFinished) {
        this.isFinished = true;
        hapticService.workoutFinished();
      }
      this.emit(0, "finished", totalRounds, totalRounds, elapsedMs);
      this.engine.stop();
      return;
    }

    this.emit(remaining, "work", currentRound, totalRounds, elapsedMs);
  }

  private processForTime(elapsedMs: number): void {
    const capMs = this.config.durationSec ? this.config.durationSec * 1000 : Infinity;

    if (elapsedMs >= capMs && !this.isFinished) {
      this.isFinished = true;
      hapticService.warning();
      this.emit(elapsedMs, "finished", this.round, undefined, elapsedMs);
      this.engine.stop();
      return;
    }

    this.emit(elapsedMs, "work", this.round, undefined, elapsedMs);
  }

  private processTabata(elapsedMs: number): void {
    const workMs = (this.config.workSec || 20) * 1000;
    const restMs = (this.config.restSec || 10) * 1000;
    const cycleMs = workMs + restMs;
    const totalRounds = this.config.rounds || 8;

    const currentCycle = Math.floor(elapsedMs / cycleMs);
    const timeInCycle = elapsedMs % cycleMs;

    if (currentCycle >= totalRounds && !this.isFinished) {
      this.isFinished = true;
      hapticService.workoutFinished();
      this.emit(0, "finished", totalRounds, totalRounds, elapsedMs);
      this.engine.stop();
      return;
    }

    const currentRound = currentCycle + 1;
    const isWork = timeInCycle < workMs;
    const phase: TimerPhase = isWork ? "work" : "rest";

    // Alert on phase change
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
      if (isWork) {
        hapticService.roundComplete();
      } else {
        hapticService.light();
      }
    }

    const timeInPhase = isWork ? workMs - timeInCycle : cycleMs - timeInCycle;
    this.emit(timeInPhase, phase, currentRound, totalRounds, elapsedMs);
  }

  // ─── Helpers ──────────────────────────────────────

  private emit(
    timeMs: number,
    phase: TimerPhase,
    round: number,
    totalRounds: number | undefined,
    totalElapsedMs: number
  ): void {
    this.onUpdate({
      timeMs,
      phase,
      round,
      totalRounds,
      totalElapsedMs,
      reps: this.reps,
      isFinished: this.isFinished,
    });
  }

  private emitCurrent(): void {
    const elapsed = this.engine.getElapsed();
    this.processMode(elapsed);
  }

  private alertOnce(id: number, fn: () => void): void {
    if (this.lastRoundAlertAt !== id) {
      this.lastRoundAlertAt = id;
      fn();
    }
  }
}
