/**
 * GRIT — LIVE WORKOUT SCREEN
 *
 * Design principle: ZERO INTERACTION DURING EFFORT.
 *
 * Before: pick mode + config (2 taps max)
 * During: GIANT timer fills the screen. Auto-progression for EMOM/Tabata.
 *         Color shift for work/rest. Haptic does the talking.
 *         ONE optional tap: log a rep (big zone, bottom half of screen)
 * After:  auto-save.
 *
 * The athlete should be able to GLANCE at their phone from 2 meters away
 * and know exactly where they are.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconArrowRight } from "../components/Icons";
import { useTimer } from "../hooks/useTimer";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { formatTime } from "../utils/formatters";
import { hapticService } from "../services/haptics/hapticService";
import type { TimerMode, TimerConfig, WodSession } from "../types/workout";

const { height: SCREEN_H } = Dimensions.get("window");

type Phase = "pick" | "active" | "finished";

// ─── Quick presets (2 taps to start) ──────────────
const PRESETS = [
  { label: "STOPWATCH", desc: "Chronomètre libre", mode: "stopwatch" as TimerMode, config: { mode: "stopwatch" as TimerMode } },
  { label: "AMRAP 12'", desc: "Max reps en 12 min", mode: "amrap" as TimerMode, config: { mode: "amrap" as TimerMode, durationSec: 720 } },
  { label: "AMRAP 20'", desc: "Max reps en 20 min", mode: "amrap" as TimerMode, config: { mode: "amrap" as TimerMode, durationSec: 1200 } },
  { label: "EMOM 10'", desc: "Toutes les minutes × 10", mode: "emom" as TimerMode, config: { mode: "emom" as TimerMode, intervalSec: 60, rounds: 10 } },
  { label: "EMOM 20'", desc: "Toutes les minutes × 20", mode: "emom" as TimerMode, config: { mode: "emom" as TimerMode, intervalSec: 60, rounds: 20 } },
  { label: "TABATA", desc: "20s work / 10s rest × 8", mode: "tabata" as TimerMode, config: { mode: "tabata" as TimerMode, workSec: 20, restSec: 10, rounds: 8 } },
  { label: "FOR TIME", desc: "Le plus vite possible", mode: "forTime" as TimerMode, config: { mode: "forTime" as TimerMode, durationSec: 3600 } },
];

export const LiveWorkoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("pick");
  const [selectedConfig, setSelectedConfig] = useState<TimerConfig>(PRESETS[0].config);
  const [selectedLabel, setSelectedLabel] = useState("STOPWATCH");

  const timer = useTimer(selectedConfig);
  const activeWorkout = useActiveWorkoutStore();
  const addSession = useWorkoutHistoryStore((s) => s.addSession);

  // ─── Start ──────────────────────────────────────
  const handleStart = useCallback(async (config: TimerConfig, label: string) => {
    setSelectedConfig(config);
    setSelectedLabel(label);
    activeWorkout.startWorkout("wod");
    await activateKeepAwakeAsync();
    hapticService.roundComplete();
    setPhase("active");
    // Timer starts after state update
    setTimeout(() => timer.start(), 50);
  }, [activeWorkout, timer]);

  // ─── Stop (swipe down or long press) ────────────
  const handleStop = useCallback(() => {
    Alert.alert("END WORKOUT?", `${timer.display.reps} reps — ${formatTime(timer.display.totalElapsedMs)}`, [
      { text: "CANCEL", style: "cancel" },
      {
        text: "SAVE",
        onPress: () => {
          const elapsed = timer.stop();
          deactivateKeepAwake();
          const session = activeWorkout.completeWorkout();
          if (session) {
            const wod: WodSession = { ...session, type: "wod", totalDurationMs: elapsed, timerMode: selectedConfig.mode, timerConfig: selectedConfig, rounds: [], totalReps: timer.display.reps };
            addSession(wod);
          }
          hapticService.workoutFinished();
          setPhase("finished");
          setTimeout(() => { timer.reset(); setPhase("pick"); }, 2500);
        },
      },
    ]);
  }, [timer, activeWorkout, addSession, selectedConfig]);

  // ─── PICK SCREEN (before workout) ──────────────
  if (phase === "pick") {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>WORKOUT</Text>
        <Text style={styles.heroTitle}>SELECT{"\n"}MODE</Text>

        <View style={styles.presetGrid}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={styles.presetCard}
              onPress={() => handleStart(p.config, p.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetLabel}>{p.label}</Text>
              <Text style={styles.presetDesc}>{p.desc}</Text>
              <View style={styles.presetArrow}>
                <IconArrowRight size={12} color={colors.neonYellow} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  // ─── FINISHED FLASH ─────────────────────────────
  if (phase === "finished") {
    return (
      <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
        <Text style={styles.finishedLabel}>WORKOUT{"\n"}COMPLETE</Text>
        <Text style={styles.finishedTime}>{formatTime(timer.display.totalElapsedMs, true)}</Text>
        <Text style={styles.finishedReps}>{timer.display.reps} REPS</Text>
      </View>
    );
  }

  // ─── ACTIVE SCREEN (during workout) ─────────────
  // Design: GIANT timer. Nothing else matters.
  // Work = white on black. Rest = white on blue. Finished = green.
  const { display } = timer;
  const isRest = display.phase === "rest";
  const isFinished = display.isFinished;

  const bgColor = isFinished ? "#0A2A0A" : isRest ? "#0A1A3A" : colors.black;
  const timeColor = isFinished ? colors.success : isRest ? "#60A5FA" : colors.offWhite;
  const phaseText = isFinished ? "DONE" : isRest ? "REST" : display.totalRounds ? `${selectedLabel}` : selectedLabel;

  // Countdown display for AMRAP (shows remaining), others show elapsed
  const showTime = selectedConfig.mode === "amrap" || selectedConfig.mode === "tabata" || selectedConfig.mode === "emom"
    ? display.timeMs
    : display.totalElapsedMs;

  return (
    <View style={[styles.fullScreen, { backgroundColor: bgColor, paddingTop: insets.top }]}>

      {/* Top: mode + round info (tiny, out of the way) */}
      <View style={styles.activeTop}>
        <Text style={styles.activeLabel}>{phaseText}</Text>
        {display.totalRounds && (
          <Text style={styles.roundText}>
            {display.round}<Text style={{ color: colors.ash }}>/{display.totalRounds}</Text>
          </Text>
        )}
      </View>

      {/* CENTER: GIANT TIMER (readable from 2m) */}
      <View style={styles.timerCenter}>
        <Text style={[styles.giantTime, { color: timeColor }]}>
          {formatTime(showTime)}
        </Text>
        {selectedConfig.mode !== "stopwatch" && (
          <Text style={styles.totalSmall}>
            {formatTime(display.totalElapsedMs)}
          </Text>
        )}
      </View>

      {/* BOTTOM: Rep counter (tap anywhere in bottom half) */}
      <TouchableOpacity
        style={styles.repZone}
        onPress={() => timer.logRep()}
        activeOpacity={0.9}
      >
        <Text style={styles.repCount}>{display.reps}</Text>
        <Text style={styles.repLabel}>TAP TO LOG REP</Text>
      </TouchableOpacity>

      {/* Stop button (small, corner — not accidental) */}
      <TouchableOpacity
        style={[styles.stopCorner, { bottom: insets.bottom + 90 }]}
        onPress={handleStop}
        onLongPress={handleStop}
        activeOpacity={0.7}
      >
        <View style={styles.stopDot} />
      </TouchableOpacity>

      {/* Pause (small, other corner) */}
      <TouchableOpacity
        style={[styles.pauseCorner, { bottom: insets.bottom + 90 }]}
        onPress={() => timer.isPaused ? timer.resume() : timer.pause()}
        activeOpacity={0.7}
      >
        <Text style={styles.pauseText}>{timer.isPaused ? "▶" : "⏸"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },

  // Pick screen
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4 },
  heroTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", lineHeight: 48, marginTop: spacing.sm, marginBottom: spacing.xl },

  presetGrid: { gap: 8 },
  presetCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.carbon, borderRadius: 12, borderWidth: 1, borderColor: colors.graphite, padding: spacing.lg },
  presetLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.offWhite, letterSpacing: 2, flex: 1 },
  presetDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, flex: 1.2 },
  presetArrow: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },

  // Active screen
  fullScreen: { flex: 1, backgroundColor: colors.black },

  activeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  activeLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.neonYellow, letterSpacing: 4 },
  roundText: { fontFamily: fonts.mono, fontSize: 20, fontWeight: "700", color: colors.offWhite },

  timerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  giantTime: { fontFamily: fonts.mono, fontSize: 96, fontWeight: "700", letterSpacing: -4 },
  totalSmall: { fontFamily: fonts.mono, fontSize: 16, color: colors.ash, marginTop: spacing.xs, letterSpacing: 2 },

  repZone: { height: SCREEN_H * 0.22, alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: colors.graphite },
  repCount: { fontFamily: fonts.mono, fontSize: 64, fontWeight: "700", color: colors.neonYellow },
  repLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash, letterSpacing: 4, marginTop: 4 },

  stopCorner: { position: "absolute", right: spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", alignItems: "center", justifyContent: "center" },
  stopDot: { width: 16, height: 16, borderRadius: 3, backgroundColor: colors.danger },
  pauseCorner: { position: "absolute", left: spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  pauseText: { fontSize: 16, color: colors.offWhite },

  // Finished
  finishedLabel: { fontFamily: fonts.headline, fontSize: 48, color: colors.neonYellow, textTransform: "uppercase", textAlign: "center", lineHeight: 50, marginTop: SCREEN_H * 0.25 },
  finishedTime: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.offWhite, textAlign: "center", marginTop: spacing.lg },
  finishedReps: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ash, textAlign: "center", letterSpacing: 4, marginTop: spacing.sm },
});
