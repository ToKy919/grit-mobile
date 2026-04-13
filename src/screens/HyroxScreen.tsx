/**
 * GRIT — HYROX MODE SCREEN (Production)
 *
 * Real station progression with timers per station.
 * Transition tracking. Haptic feedback.
 * 16 stations: 8 runs + 8 exercises.
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconCheck, IconLock, IconPause, IconStop, IconArrowRight, IconHyrox } from "../components/Icons";
import { useHyroxSession } from "../hooks/useHyroxSession";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { formatTime } from "../utils/formatters";
import { hapticService } from "../services/haptics/hapticService";
import type { HyroxSession as HyroxSessionType } from "../types/workout";

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
    Alert.alert("End Race?", `${hyrox.completedCount}/${hyrox.totalStations} stations — ${formatTime(hyrox.totalElapsedMs, true)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save & End",
        style: "destructive",
        onPress: () => {
          deactivateKeepAwake();
          const session = activeWorkout.completeWorkout();
          if (session) {
            const hyroxSession: HyroxSessionType = {
              ...session,
              type: "hyrox",
              totalDurationMs: hyrox.totalElapsedMs,
              stations: hyrox.stations,
              currentStationIndex: hyrox.currentIndex,
            };
            addSession(hyroxSession);
          }
          hapticService.workoutFinished();
          hyrox.reset();
        },
      },
    ]);
  };

  // ─── Idle State ─────────────────────────────────
  if (hyrox.phase === "idle") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.idleContent}>
          <IconHyrox size={48} color={colors.ash} />
          <Text style={styles.idleTitle}>HYROX RACE SIM</Text>
          <Text style={styles.idleDesc}>16 stations — 8 x 1km runs alternées avec 8 exercices</Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>START RACE</Text>
            <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Finished State ─────────────────────────────
  if (hyrox.phase === "finished") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.idleContent}>
          <Text style={styles.finishedTitle}>RACE COMPLETE</Text>
          <Text style={styles.finishedTime}>{formatTime(hyrox.totalElapsedMs, true)}</Text>
          <Text style={styles.idleDesc}>{hyrox.completedCount} stations completed</Text>
          <TouchableOpacity style={styles.startBtn} onPress={hyrox.reset} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Racing / Paused State ──────────────────────
  const currentStation = hyrox.stations[hyrox.currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>HYROX RACE SIM</Text>
        <View style={styles.headerRow}>
          <Text style={styles.heroTitle}>ROXZONE</Text>
          <Text style={styles.totalTimer}>{formatTime(hyrox.totalElapsedMs)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>RACE PROGRESS</Text>
          <Text style={styles.progressCount}>{hyrox.completedCount}/{hyrox.totalStations}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(hyrox.completedCount / hyrox.totalStations) * 100}%` }]} />
        </View>
      </View>

      {/* Current Station Display */}
      <View style={styles.currentBlock}>
        {hyrox.isTransition ? (
          <>
            <Text style={styles.transitionLabel}>TRANSITION</Text>
            <Text style={styles.transitionTimer}>{formatTime(hyrox.transitionElapsedMs)}</Text>
            <Text style={styles.transitionNext}>Next: {currentStation.stationDef.name}</Text>
            <TouchableOpacity style={styles.goBtn} onPress={hyrox.startNextStation} activeOpacity={0.85}>
              <Text style={styles.goBtnText}>GO</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stationLabel}>{currentStation.stationDef.name}</Text>
            <Text style={styles.stationDetail}>{currentStation.stationDef.detail}</Text>
            <Text style={styles.stationTimer}>{formatTime(hyrox.stationElapsedMs)}</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={hyrox.nextStation} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>STATION DONE</Text>
              <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stations List */}
      <ScrollView style={styles.stationsList} showsVerticalScrollIndicator={false}>
        {hyrox.stations.map((s, i) => {
          const isDone = s.status === "completed";
          const isActive = s.status === "active";
          const isLocked = s.status === "pending";
          const isTransitioning = s.status === "transition";

          return (
            <View
              key={s.stationDef.id}
              style={[styles.stationRow, isActive && styles.stationActive, isLocked && { opacity: 0.35 }]}
            >
              {isActive && <View style={styles.activeGlow} />}

              <View style={[styles.statusCircle, isDone && styles.statusDone, isActive && styles.statusActiveCircle]}>
                {isDone && <IconCheck size={14} color={colors.black} strokeWidth={3} />}
                {isActive && <View style={styles.activeDot} />}
                {isLocked && <IconLock size={10} color={colors.ash} />}
              </View>

              <View style={{ flex: 1, zIndex: 1 }}>
                <Text style={[styles.stationName, isActive && { color: colors.neonYellow }]}>{s.stationDef.name}</Text>
                <Text style={styles.stationInfo}>{s.stationDef.detail}</Text>
              </View>

              {isDone && s.durationMs !== undefined && (
                <Text style={styles.stationTime}>{formatTime(s.durationMs)}</Text>
              )}
              {isActive && <Text style={styles.nowBadge}>NOW</Text>}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={hyrox.phase === "paused" ? hyrox.resumeRace : hyrox.pauseRace}
        >
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
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },

  // Idle
  idleContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  idleTitle: { fontFamily: fonts.headline, fontSize: 32, color: colors.offWhite },
  idleDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center", paddingHorizontal: 32 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.neonYellow, paddingVertical: 18, paddingHorizontal: 48, borderRadius: 12 },
  startBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.black, letterSpacing: 4 },

  // Finished
  finishedTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.neonYellow, letterSpacing: 6 },
  finishedTime: { fontFamily: fonts.mono, fontSize: 56, fontWeight: "700", color: colors.offWhite },

  // Header
  header: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroTitle: { fontFamily: fonts.headline, fontSize: 32, color: colors.offWhite },
  totalTimer: { fontFamily: fonts.mono, fontSize: 24, fontWeight: "700", color: colors.offWhite },

  // Progress
  progressSection: { marginBottom: spacing.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  progressCount: { fontFamily: fonts.mono, fontSize: 12, fontWeight: "700", color: colors.neonYellow },
  progressTrack: { height: 4, backgroundColor: colors.graphite, borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: colors.neonYellow, borderRadius: 2 },

  // Current Station
  currentBlock: { alignItems: "center", paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.graphite, marginBottom: spacing.sm },
  stationLabel: { fontFamily: fonts.headline, fontSize: 28, color: colors.neonYellow, marginBottom: 4 },
  stationDetail: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 3, marginBottom: spacing.sm },
  stationTimer: { fontFamily: fonts.mono, fontSize: 48, fontWeight: "700", color: colors.offWhite, marginBottom: spacing.md },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.neonYellow, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  nextBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.black, letterSpacing: 3 },

  // Transition
  transitionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.warning, letterSpacing: 4, marginBottom: 8 },
  transitionTimer: { fontFamily: fonts.mono, fontSize: 36, fontWeight: "700", color: colors.warning, marginBottom: 4 },
  transitionNext: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, marginBottom: spacing.md },
  goBtn: { backgroundColor: colors.neonYellow, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 10 },
  goBtnText: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.black, letterSpacing: 6 },

  // Stations List
  stationsList: { flex: 1 },
  stationRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "rgba(42,42,42,0.4)", gap: 12, marginBottom: 4, overflow: "hidden" },
  stationActive: { backgroundColor: colors.carbon, borderColor: colors.neonYellow },
  activeGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.neonYellowDim, opacity: 0.5 },
  statusCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center", zIndex: 1 },
  statusDone: { backgroundColor: colors.neonYellow },
  statusActiveCircle: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.neonYellow },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.neonYellow },
  stationName: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.offWhite, letterSpacing: 1 },
  stationInfo: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },
  stationTime: { fontFamily: fonts.mono, fontSize: 13, fontWeight: "600", color: colors.silver, zIndex: 1 },
  nowBadge: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.neonYellow, letterSpacing: 2, zIndex: 1 },

  // Controls
  controls: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: spacing.sm },
  pauseBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
});
