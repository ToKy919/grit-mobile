/**
 * GRIT — HYROX MODE SCREEN
 *
 * Exact Remotion design + real station engine.
 * ROXZONE header, progress bar, station list with done/active/locked.
 * During race: giant timer + ONE tap to advance.
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors, fonts, spacing } from "../design/tokens";
import { IconCheck, IconLock, IconArrowRight } from "../components/Icons";
import { FadeSlideUp, stagger } from "../components/Animated";
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
            addSession({ ...session, type: "hyrox", totalDurationMs: hyrox.totalElapsedMs, stations: hyrox.stations, currentStationIndex: hyrox.currentIndex } as HyroxSessionType);
          }
          hapticService.workoutFinished();
          hyrox.reset();
        },
      },
    ]);
  };

  const progress = (hyrox.completedCount / hyrox.totalStations) * 100;

  // ─── IDLE (Remotion design: ROXZONE + station list) ─
  if (hyrox.phase === "idle" || hyrox.phase === "finished") {
    return (
      <ScrollView style={[styles.screen, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <FadeSlideUp delay={0}>
          <Text style={styles.label}>HYROX RACE SIM</Text>
        </FadeSlideUp>

        <FadeSlideUp delay={stagger(1)}>
          <Text style={styles.heroTitle}>ROXZONE</Text>
        </FadeSlideUp>

        {hyrox.phase === "finished" && (
          <FadeSlideUp delay={stagger(2)}>
            <View style={styles.finBanner}>
              <Text style={styles.finBannerLabel}>RACE COMPLETE</Text>
              <Text style={styles.finBannerTime}>{formatTime(hyrox.totalElapsedMs, true)}</Text>
            </View>
          </FadeSlideUp>
        )}

        {/* Station list (Remotion layout: circle + name + detail + time) */}
        <View style={styles.stationList}>
          {hyrox.stations.map((s, i) => {
            const isDone = s.status === "completed";
            const isActive = s.status === "active";

            return (
              <FadeSlideUp key={s.stationDef.id} delay={stagger(i + 3, 40)}>
                <View style={[styles.stationRow, isActive && styles.stationActive, !isDone && !isActive && { opacity: 0.4 }]}>
                  {isActive && <View style={styles.activeGlow} />}

                  <View style={[styles.statusCircle, isDone && styles.statusDone, isActive && styles.statusActiveCir]}>
                    {isDone && <IconCheck size={14} color={colors.black} strokeWidth={3} />}
                    {isActive && <View style={styles.activeDot} />}
                    {!isDone && !isActive && <IconLock size={10} color={colors.ash} />}
                  </View>

                  <View style={{ flex: 1, zIndex: 1 }}>
                    <Text style={[styles.stationName, isActive && { color: colors.neonYellow }, isDone && { color: colors.offWhite }]}>
                      {s.stationDef.name}
                    </Text>
                    <Text style={styles.stationDetail}>{s.stationDef.detail}</Text>
                  </View>

                  {isDone && s.durationMs != null && (
                    <Text style={styles.stationTime}>{formatTime(s.durationMs)}</Text>
                  )}
                  {isActive && <Text style={styles.nowBadge}>NOW</Text>}
                </View>
              </FadeSlideUp>
            );
          })}
        </View>

        <FadeSlideUp delay={stagger(20)}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={hyrox.phase === "finished" ? hyrox.reset : handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{hyrox.phase === "finished" ? "DONE" : "START RACE"}</Text>
            <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
          </TouchableOpacity>
        </FadeSlideUp>

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  // ─── RACING / PAUSED (Giant timer + one tap) ────
  const current = hyrox.stations[hyrox.currentIndex];

  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top }]}>

      {/* Progress bar (top, thin — matches Remotion) */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Header: ROXZONE + total timer */}
      <View style={styles.raceHeader}>
        <View>
          <Text style={styles.label}>HYROX RACE SIM</Text>
          <Text style={styles.raceTitle}>ROXZONE</Text>
        </View>
        <Text style={styles.raceTimer}>{formatTime(hyrox.totalElapsedMs)}</Text>
      </View>

      {/* Progress count */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>RACE PROGRESS</Text>
        <Text style={styles.progressCount}>{hyrox.completedCount}/{hyrox.totalStations}</Text>
      </View>

      {/* Current station — GIANT */}
      <View style={styles.currentBlock}>
        {hyrox.isTransition ? (
          <>
            <Text style={styles.transLabel}>TRANSITION</Text>
            <Text style={styles.currentTimer}>{formatTime(hyrox.transitionElapsedMs)}</Text>
            <Text style={styles.transNext}>Next: {current.stationDef.name}</Text>
          </>
        ) : (
          <>
            <Text style={styles.currentName}>{current.stationDef.name}</Text>
            <Text style={styles.currentDetail}>{current.stationDef.detail}</Text>
            <Text style={styles.currentTimer}>{formatTime(hyrox.stationElapsedMs)}</Text>
          </>
        )}
      </View>

      {/* Scrollable completed stations */}
      <ScrollView style={styles.completedList} showsVerticalScrollIndicator={false}>
        {hyrox.stations.slice(0, hyrox.currentIndex).filter((s) => s.status === "completed").map((s) => (
          <View key={s.stationDef.id} style={styles.completedRow}>
            <View style={styles.completedCircle}>
              <IconCheck size={10} color={colors.black} strokeWidth={3} />
            </View>
            <Text style={styles.completedName}>{s.stationDef.name}</Text>
            <Text style={styles.completedTime}>{s.durationMs ? formatTime(s.durationMs) : ""}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom: ONE massive tap zone */}
      {hyrox.isTransition ? (
        <TouchableOpacity style={styles.goZone} onPress={hyrox.startNextStation} activeOpacity={0.85}>
          <Text style={styles.goText}>GO</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.doneZone} onPress={hyrox.nextStation} activeOpacity={0.85}>
          <Text style={styles.doneText}>DONE</Text>
        </TouchableOpacity>
      )}

      {/* Tiny stop corner */}
      <TouchableOpacity style={[styles.stopCorner, { top: insets.top + 8 }]} onPress={handleStop}>
        <View style={styles.stopDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  fullScreen: { flex: 1, backgroundColor: colors.black },

  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 42, color: colors.offWhite, textTransform: "uppercase", letterSpacing: -2, marginBottom: spacing.lg },

  // Finished banner
  finBanner: { backgroundColor: "rgba(239,255,0,0.06)", borderWidth: 1, borderColor: "rgba(239,255,0,0.2)", borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg, alignItems: "center" },
  finBannerLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4, marginBottom: 8 },
  finBannerTime: { fontFamily: fonts.mono, fontSize: 36, fontWeight: "700", color: colors.offWhite },

  // Station list (Remotion exact layout)
  stationList: { gap: 6, marginBottom: spacing.xl },
  stationRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: "rgba(42,42,42,0.4)", gap: spacing.md, overflow: "hidden" },
  stationActive: { backgroundColor: colors.carbon, borderColor: colors.neonYellow },
  activeGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.neonYellowDim, opacity: 0.5 },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center", zIndex: 1 },
  statusDone: { backgroundColor: colors.neonYellow },
  statusActiveCir: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.neonYellow },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neonYellow },
  stationName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ash, letterSpacing: 1, textTransform: "uppercase" },
  stationDetail: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, letterSpacing: 1 },
  stationTime: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "600", color: colors.silver, zIndex: 1 },
  nowBadge: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 2, zIndex: 1 },

  ctaButton: { backgroundColor: colors.neonYellow, paddingVertical: 18, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, shadowColor: colors.neonYellow, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 6 },

  // Racing
  progressTrack: { height: 4, backgroundColor: colors.graphite },
  progressFill: { height: "100%", backgroundColor: colors.neonYellow },
  raceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.sm },
  raceTitle: { fontFamily: fonts.headline, fontSize: 32, color: colors.offWhite, textTransform: "uppercase" },
  raceTimer: { fontFamily: fonts.mono, fontSize: 24, fontWeight: "700", color: colors.offWhite },
  progressRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  progressCount: { fontFamily: fonts.mono, fontSize: 12, fontWeight: "700", color: colors.neonYellow },

  currentBlock: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  currentName: { fontFamily: fonts.headline, fontSize: 36, color: colors.offWhite, textTransform: "uppercase", textAlign: "center" },
  currentDetail: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ash, letterSpacing: 4, marginTop: 6 },
  currentTimer: { fontFamily: fonts.mono, fontSize: 64, fontWeight: "700", color: colors.offWhite, marginTop: spacing.md, letterSpacing: -3 },
  transLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.warning, letterSpacing: 6 },
  transNext: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ash, marginTop: spacing.md },

  completedList: { maxHeight: 100, paddingHorizontal: spacing.lg },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  completedCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.neonYellow, alignItems: "center", justifyContent: "center" },
  completedName: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.silver, flex: 1 },
  completedTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.silver },

  doneZone: { height: SCREEN_H * 0.12, backgroundColor: "rgba(239,255,0,0.06)", borderTopWidth: 1, borderTopColor: "rgba(239,255,0,0.15)", alignItems: "center", justifyContent: "center" },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.neonYellow, letterSpacing: 8 },
  goZone: { height: SCREEN_H * 0.12, backgroundColor: "rgba(239,255,0,0.12)", borderTopWidth: 2, borderTopColor: colors.neonYellow, alignItems: "center", justifyContent: "center" },
  goText: { fontFamily: fonts.headline, fontSize: 42, color: colors.neonYellow },

  stopCorner: { position: "absolute", right: spacing.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", alignItems: "center", justifyContent: "center" },
  stopDot: { width: 12, height: 12, borderRadius: 2, backgroundColor: colors.danger },
});
