/**
 * GRIT — Timer Engine
 *
 * Date.now()-anchored timer — immune to setInterval drift.
 * 100ms tick for smooth display, actual elapsed computed from timestamps.
 * Zero drift. Battery friendly.
 */

export type TimerTickCallback = (elapsedMs: number) => void;

export class TimerEngine {
  private startTimestamp: number = 0;
  private totalPausedMs: number = 0;
  private pauseTimestamp: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick: TimerTickCallback | null = null;
  private _isRunning: boolean = false;
  private _isPaused: boolean = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Start the timer. Calls onTick every ~100ms with elapsed milliseconds.
   */
  start(onTick: TimerTickCallback): void {
    if (this._isRunning) return;

    this.startTimestamp = Date.now();
    this.totalPausedMs = 0;
    this.pauseTimestamp = null;
    this.onTick = onTick;
    this._isRunning = true;
    this._isPaused = false;

    this.intervalId = setInterval(() => {
      if (this._isPaused || !this.onTick) return;
      this.onTick(this.getElapsed());
    }, 100);

    // Emit initial tick
    onTick(0);
  }

  /**
   * Pause — records pause timestamp
   */
  pause(): void {
    if (!this._isRunning || this._isPaused) return;
    this.pauseTimestamp = Date.now();
    this._isPaused = true;
  }

  /**
   * Resume — accumulates paused duration
   */
  resume(): void {
    if (!this._isRunning || !this._isPaused || !this.pauseTimestamp) return;
    this.totalPausedMs += Date.now() - this.pauseTimestamp;
    this.pauseTimestamp = null;
    this._isPaused = false;
  }

  /**
   * Stop — clears interval, returns final elapsed
   */
  stop(): number {
    const elapsed = this.getElapsed();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._isRunning = false;
    this._isPaused = false;
    this.onTick = null;
    return elapsed;
  }

  /**
   * Get current elapsed time in milliseconds (excludes paused time)
   */
  getElapsed(): number {
    if (!this._isRunning) return 0;
    const now = this._isPaused ? this.pauseTimestamp! : Date.now();
    return now - this.startTimestamp - this.totalPausedMs;
  }

  /**
   * Destroy — cleanup for unmount
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onTick = null;
    this._isRunning = false;
  }
}
