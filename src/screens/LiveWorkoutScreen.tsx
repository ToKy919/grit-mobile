/**
 * GRIT — LIVE WORKOUT SCREEN
 *
 * Exact Remotion design + real timers.
 * Pure focus mode. Giant timer. Essential data only.
 *
 * Flow: Pick mode (1 tap) → Countdown 3-2-1 → GIANT timer
 * During: auto-progression, haptics, color shifts
 * One tap zone for reps. Tiny stop/pause in corners.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconArrowRight, IconPause, IconStop } from "../components/Icons";
import { FadeSlideUp, stagger } from "../components/Animated";
import { useTimer } from "../hooks/useTimer";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { formatTime } from "../utils/formatters";
import { hapticService } from "../services/haptics/hapticService";
import type { TimerMode, TimerConfig, WodSession } from "../types/workout";

const { height: SCREEN_H } = Dimensions.get("window");

type Phase = "pick" | "active" | "finished";

const PRESETS: { label: string; desc: string; config: TimerConfig }[] = [
  { label: "STOPWATCH", desc: "Chronomètre libre", config: { mode: "stopwatch" } },
  { label: "AMRAP 12'", desc: "Max reps en 12 min", config: { mode: "amrap", durationSec: 720 } },
  { label: "AMRAP 20'", desc: "Max reps en 20 min", config: { mode: "amrap", durationSec: 1200 } },
  { label: "EMOM 10×1'", desc: "Toutes les minutes × 10", config: { mode: "emom", intervalSec: 60, rounds: 10 } },
  { label: "TABATA", desc: "20s work / 10s rest × 8", config: { mode: "tabata", workSec: 20, restSec: 10, rounds: 8 } },
  { label: "FOR TIME", desc: "Le plus vite possible", config: { mode: "forTime", durationSec: 3600 } },
];

export const LiveWorkoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("pick");
  const [activeConfig, setActiveConfig] = useState<TimerConfig>(PRESETS[0].config);
  const [activeLabel, setActiveLabel] = useState("STOPWATCH");

  const timer = useTimer(activeConfig);
  const activeWorkout = useActiveWorkoutStore();
  const { addSession } = useWorkoutHistoryStore();

  const handleStart = useCallback(async (preset: typeof PRESETS[0]) => {
    setActiveConfig(preset.config);
    setActiveLabel(preset.label);
    activeWorkout.startWorkout("wod");
    await activateKeepAwakeAsync();
    hapticService.roundComplete();
    setPhase("active");
    setTimeout(() => timer.start(), 100);
  }, [activeWorkout, timer]);

  const handleStop = useCallback(() => {
    Alert.alert("END WORKOUT?", `${timer.display.reps} reps · ${formatTime(timer.display.totalElapsedMs)}`, [
      { text: "CANCEL", style: "cancel" },
      {
        text: "SAVE",
        onPress: () => {
          const elapsed = timer.stop();
          deactivateKeepAwake();
          const session = activeWorkout.completeWorkout();
          if (session) {
            addSession({ ...session, type: "wod", totalDurationMs: elapsed, timerMode: activeConfig.mode, timerConfig: activeConfig, rounds: [], totalReps: timer.display.reps } as WodSession);
          }
          hapticService.workoutFinished();
          setPhase("finished");
          setTimeout(() => { timer.reset(); setPhase("pick"); }, 2500);
        },
      },
    ]);
  }, [timer, activeWorkout, addSession, activeConfig]);

  // ─── PICK MODE (Remotion editorial style) ───────
  if (phase === "pick") {
    return (
      <ScrollView style={[styles.screen, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <FadeSlideUp delay={0}>
          <Text style={styles.label}>WORKOUT</Text>
        </FadeSlideUp>
        <FadeSlideUp delay={stagger(1)}>
          <Text style={styles.heroTitle}>SELECT{"\n"}MODE</Text>
        </FadeSlideUp>

        <View style={styles.presetList}>
          {PRESETS.map((p, i) => (
            <FadeSlideUp key={p.label} delay={stagger(i + 2, 50)}>
              <TouchableOpacity
                style={styles.presetCard}
                onPress={() => handleStart(p)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetDesc}>{p.desc}</Text>
                </View>
                <View style={styles.presetArrow}>
                  <IconArrowRight size={12} color={colors.neonYellow} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </FadeSlideUp>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  // ─── FINISHED ───────────────────────────────────
  if (phase === "finished") {
    return (
      <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
        <FadeSlideUp delay={0} style={styles.finCenter}>
          <Text style={styles.finLabel}>WORKOUT{"\n"}COMPLETE</Text>
          <Text style={styles.finTime}>{formatTime(timer.display.totalElapsedMs, true)}</Text>
          <Text style={styles.finReps}>{timer.display.reps} REPS</Text>
        </FadeSlideUp>
      </View>
    );
  }

  // ─── ACTIVE (Remotion design: giant timer + metrics) ───
  const { display } = timer;
  const isRest = display.phase === "rest";
  const bgColor = isRest ? "#0A1230" : colors.black;
  const timeColor = isRest ? "#60A5FA" : colors.offWhite;

  const showTime = activeConfig.mode === "stopwatch" || activeConfig.mode === "forTime"
    ? display.totalElapsedMs
    : display.timeMs;

  return (
    <View style={[styles.fullScreen, { backgroundColor: bgColor, paddingTop: insets.top }]}>

      {/* Top Bar — matches Remotion ACTIVE SESSION + REC */}
      <FadeSlideUp delay={0}>
        <View style={styles.activeTop}>
          <Text style={styles.activeLabel}>{activeLabel}</Text>
          <View style={styles.recBadge}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
            <Text style={styles.recText}>
              {display.totalRounds ? `${display.round}/${display.totalRounds}` : "ACTIVE"}
            </Text>
          </View>
        </View>
      </FadeSlideUp>

      {/* GIANT TIMER — readable from 2 meters */}
      <View style={styles.timerCenter}>
        <Text style={[styles.giantTimer, { color: timeColor }]}>
          {formatTime(showTime)}
        </Text>
        <Text style={styles.timerSub}>
          {isRest ? "REST" : activeConfig.mode !== "stopwatch" ? formatTime(display.totalElapsedMs) : "ELAPSED TIME"}
        </Text>
      </View>

      {/* Metrics row — matches Remotion 3-card layout */}
      <FadeSlideUp delay={200}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>REPS</Text>
            <Text style={[styles.metricValue, { color: colors.neonYellow }]}>{display.reps}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ROUND</Text>
            <Text style={styles.metricValue}>{display.round}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PHASE</Text>
            <Text style={[styles.metricValue, { fontSize: 16, color: isRest ? "#60A5FA" : colors.offWhite }]}>
              {isRest ? "REST" : "WORK"}
            </Text>
          </View>
        </View>
      </FadeSlideUp>

      {/* Bottom tap zone for reps */}
      <TouchableOpacity
        style={styles.repZone}
        onPress={() => timer.logRep()}
        activeOpacity={0.9}
      >
        <Text style={styles.repText}>+ REP</Text>
      </TouchableOpacity>

      {/* Controls — small corners (Remotion pause/stop layout) */}
      <View style={[styles.controlsRow, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => timer.isPaused ? timer.resume() : timer.pause()}>
          <IconPause size={20} color={colors.offWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
          <IconStop size={22} color={colors.offWhite} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  fullScreen: { flex: 1, backgroundColor: colors.black },

  // Pick
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4 },
  heroTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", lineHeight: 48, marginTop: spacing.xs, marginBottom: spacing.xl },
  presetList: { gap: 8 },
  presetCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.carbon, borderRadius: 12, borderWidth: 1, borderColor: colors.graphite, paddingVertical: 18, paddingHorizontal: spacing.lg },
  presetLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.offWhite, letterSpacing: 2, marginBottom: 4 },
  presetDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  presetArrow: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },

  // Active
  activeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.md },
  activeLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4 },
  recBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  recText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.danger, letterSpacing: 2 },

  timerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  giantTimer: { fontFamily: fonts.mono, fontSize: 88, fontWeight: "700", letterSpacing: -4 },
  timerSub: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash, letterSpacing: 6, marginTop: spacing.xs, textTransform: "uppercase" },

  metricsRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  metricCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 4 },
  metricLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  metricValue: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "700", color: colors.offWhite },

  repZone: { height: 80, borderTopWidth: 1, borderTopColor: colors.graphite, alignItems: "center", justifyContent: "center" },
  repText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.neonYellow, letterSpacing: 6 },

  controlsRow: { position: "absolute", left: spacing.lg, right: spacing.lg, flexDirection: "row", justifyContent: "center", gap: 24 },
  pauseBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", shadowColor: colors.danger, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },

  // Finished
  finCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  finLabel: { fontFamily: fonts.headline, fontSize: 48, color: colors.neonYellow, textTransform: "uppercase", textAlign: "center", lineHeight: 50 },
  finTime: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.offWhite, marginTop: spacing.lg },
  finReps: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ash, letterSpacing: 4, marginTop: spacing.sm },
});
