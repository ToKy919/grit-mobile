/**
 * GRIT — LIVE WORKOUT SCREEN (Production)
 *
 * Real timer modes: Stopwatch, AMRAP, EMOM, For Time, Tabata.
 * Configurable before start. Haptic feedback. Rep counter.
 * NO mock data.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconPause, IconStop, IconTimer, IconArrowRight, IconFire } from "../components/Icons";
import { useTimer } from "../hooks/useTimer";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { formatTime, formatTimePrecise } from "../utils/formatters";
import { hapticService } from "../services/haptics/hapticService";
import type { TimerMode, TimerConfig, WodSession } from "../types/workout";

type WodPhase = "config" | "active" | "paused" | "finished";

const MODE_OPTIONS: { mode: TimerMode; label: string; desc: string }[] = [
  { mode: "stopwatch", label: "STOPWATCH", desc: "Chronomètre libre" },
  { mode: "amrap", label: "AMRAP", desc: "Max reps en temps limité" },
  { mode: "emom", label: "EMOM", desc: "Toutes les X minutes" },
  { mode: "forTime", label: "FOR TIME", desc: "Le plus vite possible" },
  { mode: "tabata", label: "TABATA", desc: "Work / Rest alternés" },
];

const DURATION_OPTIONS = [
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "20 min", value: 1200 },
];

const EMOM_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "90 sec", value: 90 },
  { label: "2 min", value: 120 },
];

const ROUND_OPTIONS = [
  { label: "5", value: 5 },
  { label: "8", value: 8 },
  { label: "10", value: 10 },
  { label: "12", value: 12 },
];

export const LiveWorkoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<WodPhase>("config");

  // Config state
  const [selectedMode, setSelectedMode] = useState<TimerMode>("stopwatch");
  const [duration, setDuration] = useState(600);
  const [interval, setInterval_] = useState(60);
  const [rounds, setRounds] = useState(8);
  const [workSec, setWorkSec] = useState(20);
  const [restSec, setRestSec] = useState(10);

  // Build timer config
  const timerConfig = useMemo((): TimerConfig => {
    switch (selectedMode) {
      case "amrap": return { mode: "amrap", durationSec: duration };
      case "emom": return { mode: "emom", intervalSec: interval, rounds };
      case "forTime": return { mode: "forTime", durationSec: duration };
      case "tabata": return { mode: "tabata", workSec, restSec, rounds };
      default: return { mode: "stopwatch" };
    }
  }, [selectedMode, duration, interval, rounds, workSec, restSec]);

  const timer = useTimer(timerConfig);
  const activeWorkout = useActiveWorkoutStore();
  const addSession = useWorkoutHistoryStore((s) => s.addSession);

  // ─── Start ──────────────────────────────────────
  const handleStart = useCallback(async () => {
    activeWorkout.startWorkout("wod");
    timer.start();
    await activateKeepAwakeAsync();
    hapticService.medium();
    setPhase("active");
  }, [activeWorkout, timer]);

  // ─── Pause/Resume ───────────────────────────────
  const handlePauseResume = useCallback(() => {
    if (phase === "active") {
      timer.pause();
      activeWorkout.pauseWorkout();
      setPhase("paused");
    } else if (phase === "paused") {
      timer.resume();
      activeWorkout.resumeWorkout();
      setPhase("active");
    }
  }, [phase, timer, activeWorkout]);

  // ─── Stop ───────────────────────────────────────
  const handleStop = useCallback(() => {
    Alert.alert("End Workout?", `${timer.display.reps} reps — ${formatTime(timer.display.totalElapsedMs)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save & End",
        style: "destructive",
        onPress: () => {
          const elapsed = timer.stop();
          deactivateKeepAwake();

          const session = activeWorkout.completeWorkout();
          if (session) {
            const wodSession: WodSession = {
              ...session,
              type: "wod",
              totalDurationMs: elapsed,
              timerMode: selectedMode,
              timerConfig,
              rounds: [],
              totalReps: timer.display.reps,
            };
            addSession(wodSession);
          }

          hapticService.workoutFinished();
          setPhase("finished");
          setTimeout(() => {
            timer.reset();
            setPhase("config");
          }, 2000);
        },
      },
    ]);
  }, [timer, activeWorkout, addSession, selectedMode, timerConfig]);

  // ─── Config Screen ──────────────────────────────
  if (phase === "config") {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>WORKOUT</Text>
        <Text style={styles.heroTitle}>CONFIGURE</Text>

        {/* Mode Selection */}
        <Text style={styles.sectionLabel}>MODE</Text>
        <View style={styles.modeGrid}>
          {MODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.mode}
              style={[styles.modeCard, selectedMode === opt.mode && styles.modeCardActive]}
              onPress={() => { setSelectedMode(opt.mode); hapticService.light(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeName, selectedMode === opt.mode && { color: colors.neonYellow }]}>{opt.label}</Text>
              <Text style={styles.modeDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration (AMRAP / For Time) */}
        {(selectedMode === "amrap" || selectedMode === "forTime") && (
          <>
            <Text style={styles.sectionLabel}>DURÉE</Text>
            <View style={styles.optionRow}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, duration === opt.value && styles.optionChipActive]}
                  onPress={() => setDuration(opt.value)}
                >
                  <Text style={[styles.optionText, duration === opt.value && { color: colors.neonYellow }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* EMOM interval + rounds */}
        {selectedMode === "emom" && (
          <>
            <Text style={styles.sectionLabel}>INTERVALLE</Text>
            <View style={styles.optionRow}>
              {EMOM_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, interval === opt.value && styles.optionChipActive]}
                  onPress={() => setInterval_(opt.value)}
                >
                  <Text style={[styles.optionText, interval === opt.value && { color: colors.neonYellow }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>ROUNDS</Text>
            <View style={styles.optionRow}>
              {ROUND_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, rounds === opt.value && styles.optionChipActive]}
                  onPress={() => setRounds(opt.value)}
                >
                  <Text style={[styles.optionText, rounds === opt.value && { color: colors.neonYellow }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Tabata config */}
        {selectedMode === "tabata" && (
          <>
            <Text style={styles.sectionLabel}>WORK / REST</Text>
            <View style={styles.tabataRow}>
              <View style={styles.tabataBlock}>
                <Text style={styles.tabataLabel}>WORK</Text>
                <Text style={styles.tabataValue}>{workSec}s</Text>
                <View style={styles.tabataControls}>
                  <TouchableOpacity onPress={() => setWorkSec(Math.max(5, workSec - 5))} style={styles.tabataBtn}><Text style={styles.tabataBtnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setWorkSec(workSec + 5)} style={styles.tabataBtn}><Text style={styles.tabataBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.tabataBlock}>
                <Text style={styles.tabataLabel}>REST</Text>
                <Text style={styles.tabataValue}>{restSec}s</Text>
                <View style={styles.tabataControls}>
                  <TouchableOpacity onPress={() => setRestSec(Math.max(5, restSec - 5))} style={styles.tabataBtn}><Text style={styles.tabataBtnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setRestSec(restSec + 5)} style={styles.tabataBtn}><Text style={styles.tabataBtnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={styles.sectionLabel}>ROUNDS</Text>
            <View style={styles.optionRow}>
              {ROUND_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, rounds === opt.value && styles.optionChipActive]}
                  onPress={() => setRounds(opt.value)}
                >
                  <Text style={[styles.optionText, rounds === opt.value && { color: colors.neonYellow }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Start Button */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START {selectedMode.toUpperCase()}</Text>
          <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  // ─── Active / Paused / Finished ─────────────────
  const { display } = timer;
  const isWork = display.phase === "work";
  const isRest = display.phase === "rest";
  const isFinished = display.isFinished || phase === "finished";

  const phaseColor = isRest ? "#3B82F6" : isFinished ? colors.success : colors.offWhite;
  const phaseLabel = isFinished ? "FINISHED" : isRest ? "REST" : phase === "paused" ? "PAUSED" : selectedMode.toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Phase Label */}
      <View style={styles.topBar}>
        <Text style={[styles.phaseLabel, { color: isRest ? "#3B82F6" : colors.neonYellow }]}>{phaseLabel}</Text>
        {display.totalRounds && (
          <Text style={styles.roundLabel}>ROUND {display.round}/{display.totalRounds}</Text>
        )}
      </View>

      {/* Giant Timer */}
      <View style={styles.timerBlock}>
        <Text style={[styles.timerText, { color: phaseColor }]}>
          {formatTime(display.timeMs)}
        </Text>
        {selectedMode !== "stopwatch" && (
          <Text style={styles.totalTime}>Total: {formatTime(display.totalElapsedMs)}</Text>
        )}
      </View>

      {/* Rep Counter */}
      <View style={styles.repSection}>
        <Text style={styles.repLabel}>REPS</Text>
        <Text style={styles.repCount}>{display.reps}</Text>
        <TouchableOpacity
          style={styles.repButton}
          onPress={() => timer.logRep()}
          activeOpacity={0.7}
        >
          <Text style={styles.repButtonText}>+ REP</Text>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      {!isFinished && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseResume}>
            <IconPause size={22} color={colors.offWhite} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <IconStop size={24} color={colors.offWhite} />
          </TouchableOpacity>
        </View>
      )}

      {isFinished && (
        <View style={styles.finishedBlock}>
          <IconFire size={32} color={colors.neonYellow} />
          <Text style={styles.finishedText}>WORKOUT SAVED</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 38, color: colors.offWhite, textTransform: "uppercase", marginBottom: spacing.lg },

  // Mode Selection
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm, marginTop: spacing.md },
  modeGrid: { gap: 8 },
  modeCard: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.graphite, backgroundColor: colors.carbon },
  modeCardActive: { borderColor: colors.neonYellow, backgroundColor: "rgba(239,255,0,0.05)" },
  modeName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite, letterSpacing: 2, marginBottom: 4 },
  modeDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },

  // Options
  optionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optionChip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: colors.graphite, backgroundColor: colors.carbon },
  optionChipActive: { borderColor: colors.neonYellow, backgroundColor: "rgba(239,255,0,0.08)" },
  optionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.silver },

  // Tabata
  tabataRow: { flexDirection: "row", gap: spacing.md },
  tabataBlock: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center" },
  tabataLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3, marginBottom: 4 },
  tabataValue: { fontFamily: fonts.mono, fontSize: 32, fontWeight: "700", color: colors.offWhite, marginBottom: 8 },
  tabataControls: { flexDirection: "row", gap: 12 },
  tabataBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  tabataBtnText: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.offWhite },

  // Start
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.neonYellow, paddingVertical: 20, borderRadius: 12, marginTop: spacing.xxl },
  startBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.black, letterSpacing: 4 },

  // Active
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xxl },
  phaseLabel: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 4 },
  roundLabel: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.silver },

  timerBlock: { alignItems: "center", marginBottom: spacing.xxl },
  timerText: { fontFamily: fonts.mono, fontSize: 88, fontWeight: "700", letterSpacing: -4 },
  totalTime: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 3, marginTop: spacing.xs },

  repSection: { alignItems: "center", marginBottom: spacing.xxl },
  repLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: 4 },
  repCount: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.neonYellow, marginBottom: spacing.md },
  repButton: { backgroundColor: colors.carbon, borderWidth: 2, borderColor: colors.neonYellow, paddingVertical: 20, paddingHorizontal: 64, borderRadius: 16 },
  repButtonText: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.neonYellow, letterSpacing: 4 },

  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32 },
  pauseBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },

  finishedBlock: { alignItems: "center", gap: spacing.md },
  finishedText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.success, letterSpacing: 4 },
});
