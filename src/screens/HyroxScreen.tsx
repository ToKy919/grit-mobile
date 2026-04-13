/**
 * GRIT — HYROX MODE SCREEN
 *
 * Design principle: ONE TAP PER STATION. That's it.
 *
 * During effort:
 * - GIANT station name + timer (readable from 2m)
 * - Auto-timer runs continuously
 * - Color codes: RUN = dark, EXERCISE = accent glow
 * - ONE massive "DONE" button at bottom = advance to next station
 * - Transition timer shows automatically between stations
 * - Haptic pulse on every station change
 *
 * The whole bottom half of the screen is the "DONE" zone.
 * Sweaty fingers, fatigue, tunnel vision — it still works.
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconCheck, IconArrowRight, IconHyrox } from "../components/Icons";
import { useHyroxSession } from "../hooks/useHyroxSession";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { formatTime } from "../utils/formatters";
import { hapticService } from "../services/haptics/hapticService";
import type { HyroxSession as HyroxSessionType } from "../types/workout";

const { height: SCREEN_H } = Dimensions.get("window");

export const HyroxScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const hyrox = useHyroxSession();
  const activeWorkout = useActiveWorkoutStore();
  const addSession = useWorkoutHistoryStore((s) => s.addSession);

  const handleStart = async () => {
    activeWorkout.startWorkout("hyrox");
    await activateKeepAwakeAsync();
    hyrox.startRace();
  };

  const handleStop = () => {
    Alert.alert("END RACE?", formatTime(hyrox.totalElapsedMs, true), [
      { text: "CANCEL", style: "cancel" },
      {
        text: "SAVE",
        onPress: () => {
          deactivateKeepAwake();
          const session = activeWorkout.completeWorkout();
          if (session) {
            const h: HyroxSessionType = { ...session, type: "hyrox", totalDurationMs: hyrox.totalElapsedMs, stations: hyrox.stations, currentStationIndex: hyrox.currentIndex };
            addSession(h);
          }
          hapticService.workoutFinished();
          hyrox.reset();
        },
      },
    ]);
  };

  // ─── IDLE: Race overview ────────────────────────
  if (hyrox.phase === "idle") {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>HYROX RACE SIM</Text>
        <Text style={styles.heroTitle}>ROXZONE</Text>

        {/* Station preview list */}
        <View style={styles.stationPreview}>
          {hyrox.stations.map((s, i) => (
            <View key={s.stationDef.id} style={styles.previewRow}>
              <Text style={styles.previewIndex}>{String(i + 1).padStart(2, "0")}</Text>
              <View style={styles.previewDivider} />
              <Text style={[styles.previewName, s.stationDef.isRun && { color: colors.ash }]}>
                {s.stationDef.name}
              </Text>
              <Text style={styles.previewDetail}>{s.stationDef.detail}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>START RACE</Text>
          <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  // ─── FINISHED ───────────────────────────────────
  if (hyrox.phase === "finished") {
    return (
      <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
        <View style={styles.finishedContent}>
          <Text style={styles.finLabel}>RACE</Text>
          <Text style={styles.finTitle}>COMPLETE</Text>
          <Text style={styles.finTime}>{formatTime(hyrox.totalElapsedMs, true)}</Text>
          <Text style={styles.finStations}>{hyrox.completedCount} / {hyrox.totalStations} STATIONS</Text>

          {/* Mini recap */}
          <ScrollView style={styles.finRecap} showsVerticalScrollIndicator={false}>
            {hyrox.stations.filter((s) => s.status === "completed").map((s) => (
              <View key={s.stationDef.id} style={styles.finRecapRow}>
                <Text style={styles.finRecapName}>{s.stationDef.name}</Text>
                <Text style={styles.finRecapTime}>{s.durationMs ? formatTime(s.durationMs) : "—"}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.startBtn} onPress={hyrox.reset} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── RACING / PAUSED ───────────────────────────
  const current = hyrox.stations[hyrox.currentIndex];
  const isRun = current.stationDef.isRun;
  const bgColor = hyrox.isTransition ? "#1A1A0A" : isRun ? colors.black : "#0A0A1A";
  const progress = ((hyrox.completedCount) / hyrox.totalStations) * 100;

  return (
    <View style={[styles.fullScreen, { backgroundColor: bgColor, paddingTop: insets.top }]}>

      {/* Progress bar (top edge, thin) */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Top: total time + station count (tiny) */}
      <View style={styles.raceTop}>
        <Text style={styles.raceTotal}>{formatTime(hyrox.totalElapsedMs)}</Text>
        <Text style={styles.raceCount}>{hyrox.completedCount + 1}/{hyrox.totalStations}</Text>
      </View>

      {/* CENTER: Station name + timer */}
      <View style={styles.raceCenter}>
        {hyrox.isTransition ? (
          <>
            <Text style={styles.transLabel}>TRANSITION</Text>
            <Text style={styles.transTime}>{formatTime(hyrox.transitionElapsedMs)}</Text>
            <Text style={styles.transNext}>→ {current.stationDef.name}</Text>
          </>
        ) : (
          <>
            <Text style={styles.stationName}>{current.stationDef.name}</Text>
            <Text style={styles.stationDetail}>{current.stationDef.detail}</Text>
            <Text style={styles.stationTime}>{formatTime(hyrox.stationElapsedMs)}</Text>
          </>
        )}
      </View>

      {/* BOTTOM: ONE massive tap zone */}
      {hyrox.isTransition ? (
        <TouchableOpacity
          style={styles.goZone}
          onPress={hyrox.startNextStation}
          activeOpacity={0.85}
        >
          <Text style={styles.goText}>GO</Text>
          <Text style={styles.goSub}>TAP TO START STATION</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.doneZone}
          onPress={hyrox.nextStation}
          activeOpacity={0.85}
        >
          <Text style={styles.doneText}>DONE</Text>
          <Text style={styles.doneSub}>TAP WHEN STATION COMPLETE</Text>
        </TouchableOpacity>
      )}

      {/* Stop (tiny corner button) */}
      <TouchableOpacity
        style={[styles.stopCorner, { top: insets.top + 8 }]}
        onPress={handleStop}
      >
        <View style={styles.stopDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  fullScreen: { flex: 1, backgroundColor: colors.black },

  // Idle
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", marginBottom: spacing.lg },

  stationPreview: { gap: 2, marginBottom: spacing.xl },
  previewRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: spacing.sm },
  previewIndex: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, width: 24 },
  previewDivider: { width: 1, height: 16, backgroundColor: colors.graphite },
  previewName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite, letterSpacing: 1, flex: 1 },
  previewDetail: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },

  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.neonYellow, paddingVertical: 18, borderRadius: 12 },
  startBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.black, letterSpacing: 4 },

  // Racing
  progressBar: { height: 3, backgroundColor: colors.graphite },
  progressFill: { height: "100%", backgroundColor: colors.neonYellow },

  raceTop: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  raceTotal: { fontFamily: fonts.mono, fontSize: 16, fontWeight: "700", color: colors.ash },
  raceCount: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.neonYellow },

  raceCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },

  stationName: { fontFamily: fonts.headline, fontSize: 42, color: colors.offWhite, textTransform: "uppercase", textAlign: "center", lineHeight: 44 },
  stationDetail: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ash, letterSpacing: 4, marginTop: spacing.sm },
  stationTime: { fontFamily: fonts.mono, fontSize: 72, fontWeight: "700", color: colors.offWhite, marginTop: spacing.lg, letterSpacing: -3 },

  transLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.warning, letterSpacing: 6 },
  transTime: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.warning, marginTop: spacing.md },
  transNext: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ash, marginTop: spacing.md },

  // Bottom tap zones
  doneZone: { height: SCREEN_H * 0.2, backgroundColor: "rgba(239,255,0,0.06)", borderTopWidth: 1, borderTopColor: "rgba(239,255,0,0.15)", alignItems: "center", justifyContent: "center" },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 28, color: colors.neonYellow, letterSpacing: 8 },
  doneSub: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3, marginTop: 6 },

  goZone: { height: SCREEN_H * 0.2, backgroundColor: "rgba(239,255,0,0.12)", borderTopWidth: 2, borderTopColor: colors.neonYellow, alignItems: "center", justifyContent: "center" },
  goText: { fontFamily: fonts.headline, fontSize: 48, color: colors.neonYellow },
  goSub: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3, marginTop: 6 },

  stopCorner: { position: "absolute", right: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", alignItems: "center", justifyContent: "center" },
  stopDot: { width: 12, height: 12, borderRadius: 2, backgroundColor: colors.danger },

  // Finished
  finishedContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: SCREEN_H * 0.1 },
  finLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.neonYellow, letterSpacing: 6 },
  finTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", marginBottom: spacing.md },
  finTime: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.offWhite, marginBottom: spacing.xs },
  finStations: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 4, marginBottom: spacing.lg },
  finRecap: { flex: 1, marginBottom: spacing.lg },
  finRecapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  finRecapName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.silver },
  finRecapTime: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.offWhite },
});
