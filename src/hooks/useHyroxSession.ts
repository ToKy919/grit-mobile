/**
 * GRIT — useHyroxSession Hook
 * Manages Hyrox station progression with real timers.
 */

import { useState, useCallback, useRef } from "react";
import { HYROX_STATIONS, HyroxStationResult } from "../types/hyrox";
import { TimerEngine } from "../services/timer/timerEngine";
import { hapticService } from "../services/haptics/hapticService";

export type HyroxPhase = "idle" | "racing" | "paused" | "finished";

export function useHyroxSession() {
  const [phase, setPhase] = useState<HyroxPhase>("idle");
  const [stations, setStations] = useState<HyroxStationResult[]>(
    HYROX_STATIONS.map((def) => ({ stationDef: def, status: "pending" as const }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);
  const [stationElapsedMs, setStationElapsedMs] = useState(0);
  const [transitionElapsedMs, setTransitionElapsedMs] = useState(0);
  const [isTransition, setIsTransition] = useState(false);

  const totalTimerRef = useRef(new TimerEngine());
  const stationTimerRef = useRef(new TimerEngine());
  const transitionTimerRef = useRef(new TimerEngine());

  const startRace = useCallback(() => {
    const initial: HyroxStationResult[] = HYROX_STATIONS.map((def, i) => ({
      stationDef: def,
      status: i === 0 ? "active" as const : "pending" as const,
      startedAt: i === 0 ? Date.now() : undefined,
    }));

    setStations(initial);
    setCurrentIndex(0);
    setPhase("racing");
    setIsTransition(false);

    totalTimerRef.current.start((ms) => setTotalElapsedMs(ms));
    stationTimerRef.current.start((ms) => setStationElapsedMs(ms));
    hapticService.roundComplete();
  }, []);

  const nextStation = useCallback(() => {
    const now = Date.now();
    const stationDuration = stationTimerRef.current.stop();

    setStations((prev) => {
      const updated = [...prev];
      // Complete current station
      updated[currentIndex] = {
        ...updated[currentIndex],
        status: "completed",
        completedAt: now,
        durationMs: stationDuration,
      };
      return updated;
    });

    hapticService.roundComplete();

    const nextIdx = currentIndex + 1;

    // Race finished?
    if (nextIdx >= HYROX_STATIONS.length) {
      totalTimerRef.current.stop();
      setPhase("finished");
      hapticService.workoutFinished();
      return;
    }

    // Start transition timer
    setIsTransition(true);
    setStationElapsedMs(0);
    transitionTimerRef.current.start((ms) => setTransitionElapsedMs(ms));
    setCurrentIndex(nextIdx);
  }, [currentIndex]);

  const startNextStation = useCallback(() => {
    const transitionDuration = transitionTimerRef.current.stop();
    setIsTransition(false);
    setTransitionElapsedMs(0);

    setStations((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        status: "active",
        startedAt: Date.now(),
        transitionMs: transitionDuration,
      };
      return updated;
    });

    stationTimerRef.current.start((ms) => setStationElapsedMs(ms));
    hapticService.medium();
  }, [currentIndex]);

  const pauseRace = useCallback(() => {
    totalTimerRef.current.pause();
    if (isTransition) {
      transitionTimerRef.current.pause();
    } else {
      stationTimerRef.current.pause();
    }
    setPhase("paused");
  }, [isTransition]);

  const resumeRace = useCallback(() => {
    totalTimerRef.current.resume();
    if (isTransition) {
      transitionTimerRef.current.resume();
    } else {
      stationTimerRef.current.resume();
    }
    setPhase("racing");
  }, [isTransition]);

  const reset = useCallback(() => {
    totalTimerRef.current.destroy();
    stationTimerRef.current.destroy();
    transitionTimerRef.current.destroy();
    totalTimerRef.current = new TimerEngine();
    stationTimerRef.current = new TimerEngine();
    transitionTimerRef.current = new TimerEngine();
    setStations(HYROX_STATIONS.map((def) => ({ stationDef: def, status: "pending" })));
    setCurrentIndex(0);
    setTotalElapsedMs(0);
    setStationElapsedMs(0);
    setTransitionElapsedMs(0);
    setIsTransition(false);
    setPhase("idle");
  }, []);

  const completedCount = stations.filter((s) => s.status === "completed").length;

  return {
    phase,
    stations,
    currentIndex,
    totalElapsedMs,
    stationElapsedMs,
    transitionElapsedMs,
    isTransition,
    completedCount,
    totalStations: HYROX_STATIONS.length,
    startRace,
    nextStation,
    startNextStation,
    pauseRace,
    resumeRace,
    reset,
  };
}
