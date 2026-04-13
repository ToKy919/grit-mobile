/**
 * GRIT — useTimer Hook
 * React hook wrapping TimerModeController
 */

import { useRef, useState, useCallback, useEffect } from "react";
import type { TimerConfig } from "../types/workout";
import { TimerModeController, TimerDisplay } from "../services/timer/timerModes";

const INITIAL_DISPLAY: TimerDisplay = {
  timeMs: 0,
  phase: "work",
  round: 1,
  totalRounds: undefined,
  totalElapsedMs: 0,
  reps: 0,
  isFinished: false,
};

export function useTimer(config: TimerConfig) {
  const controllerRef = useRef<TimerModeController | null>(null);
  const [display, setDisplay] = useState<TimerDisplay>(INITIAL_DISPLAY);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
    };
  }, []);

  const start = useCallback(() => {
    controllerRef.current?.destroy();

    const controller = new TimerModeController(config, (d) => {
      setDisplay(d);
      if (d.isFinished) {
        setIsRunning(false);
        setIsPaused(false);
      }
    });

    controllerRef.current = controller;
    controller.start();
    setIsRunning(true);
    setIsPaused(false);
  }, [config]);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    controllerRef.current?.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback((): number => {
    const elapsed = controllerRef.current?.stop() ?? 0;
    setIsRunning(false);
    setIsPaused(false);
    return elapsed;
  }, []);

  const logRep = useCallback(() => {
    controllerRef.current?.logRep();
  }, []);

  const nextRound = useCallback(() => {
    controllerRef.current?.nextRound();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.destroy();
    controllerRef.current = null;
    setDisplay(INITIAL_DISPLAY);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  return {
    display,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    logRep,
    nextRound,
    reset,
  };
}
