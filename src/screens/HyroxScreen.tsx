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
import { BackgroundImage } from "../components/BackgroundImage";
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

  // ─── IDLE / FINISHED ─────────────────────────────
  const runStations = hyrox.stations.filter((s) => s.stationDef.isRun);
  const exoStations = hyrox.stations.filter((s) => !s.stationDef.isRun);

  if (hyrox.phase === "idle" || hyrox.phase === "finished") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        <BackgroundImage image="crossfit" opacity={0.05} />
        <ScrollView style={[styles.screen, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <FadeSlideUp delay={0}>
          <Text style={styles.label}>HYROX RACE SIM</Text>
        </FadeSlideUp>
        <FadeSlideUp delay={stagger(1)}>
          <Text style={styles.heroTitle}>ROXZONE</Text>
        </FadeSlideUp>

        {/* Finished banner */}
        {hyrox.phase === "finished" && (
          <FadeSlideUp delay={stagger(2)}>
            <View style={styles.finBanner}>
              <Text style={styles.finBannerLabel}>RACE COMPLETE</Text>
              <Text style={styles.finBannerTime}>{formatTime(hyrox.totalElapsedMs, true)}</Text>
            </View>
          </FadeSlideUp>
        )}

        {/* Race overview cards */}
        <FadeSlideUp delay={stagger(2)}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>16</Text>
              <Text style={styles.overviewLabel}>STATIONS</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>8 km</Text>
              <Text style={styles.overviewLabel}>RUNNING</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>8</Text>
              <Text style={styles.overviewLabel}>EXERCISES</Text>
            </View>
          </View>
        </FadeSlideUp>

        {/* How it works */}
        <FadeSlideUp delay={stagger(3)}>
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>COMMENT ÇA MARCHE</Text>
            <Text style={styles.howStep}>1. Appuie START RACE pour lancer le chrono</Text>
            <Text style={styles.howStep}>2. Appuie DONE quand tu termines une station</Text>
            <Text style={styles.howStep}>3. Le chrono de transition se lance automatiquement</Text>
            <Text style={styles.howStep}>4. Appuie GO pour démarrer la station suivante</Text>
          </View>
        </FadeSlideUp>

        {/* Station list with alternating RUN / EXERCISE visual */}
        <FadeSlideUp delay={stagger(4)}>
          <Text style={styles.stationListTitle}>PARCOURS</Text>
        </FadeSlideUp>

        <View style={styles.stationList}>
          {hyrox.stations.map((s, i) => {
            const isDone = s.status === "completed";
            const isRun = s.stationDef.isRun;

            return (
              <FadeSlideUp key={s.stationDef.id} delay={stagger(i + 5, 30)}>
                <View style={[styles.stationRow, isDone && styles.stationDoneRow]}>
                  {/* Number */}
                  <View style={[styles.stationNum, isRun ? styles.stationNumRun : styles.stationNumExo]}>
                    <Text style={[styles.stationNumText, !isRun && { color: colors.black }]}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stationName, isRun && { color: colors.ash }]}>
                      {s.stationDef.name}
                    </Text>
                    <Text style={styles.stationDetail}>{s.stationDef.detail}</Text>
                  </View>

                  {/* Type badge */}
                  <View style={[styles.typeBadge, isRun ? styles.typeBadgeRun : styles.typeBadgeExo]}>
                    <Text style={[styles.typeBadgeText, !isRun && { color: colors.black }]}>
                      {isRun ? "RUN" : "EXO"}
                    </Text>
                  </View>

                  {/* Time if done */}
                  {isDone && s.durationMs != null && (
                    <Text style={styles.stationTime}>{formatTime(s.durationMs)}</Text>
                  )}
                </View>
              </FadeSlideUp>
            );
          })}
        </View>

        {/* CTA */}
        <FadeSlideUp delay={stagger(22)}>
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
      </View>
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

  // Overview cards
  overviewRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  overviewCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, paddingVertical: spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.graphite },
  overviewValue: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.offWhite, marginBottom: 4 },
  overviewLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },

  // How it works
  howItWorks: { backgroundColor: colors.carbon, borderRadius: 12, borderWidth: 1, borderColor: colors.graphite, padding: spacing.lg, marginBottom: spacing.lg },
  howTitle: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 4, marginBottom: spacing.sm },
  howStep: { fontFamily: fonts.body, fontSize: 13, color: colors.silver, lineHeight: 22, marginBottom: 4 },

  // Station list
  stationListTitle: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  stationList: { gap: 4, marginBottom: spacing.xl },
  stationRow: { flexDirection: "row", alignItems: "center", padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.graphite, gap: spacing.md },
  stationDoneRow: { borderColor: "rgba(239,255,0,0.15)", backgroundColor: "rgba(239,255,0,0.03)" },
  stationNum: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  stationNumRun: { backgroundColor: colors.graphite },
  stationNumExo: { backgroundColor: colors.neonYellow },
  stationNumText: { fontFamily: fonts.mono, fontSize: 11, fontWeight: "700", color: colors.offWhite },
  stationName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.offWhite, letterSpacing: 1, textTransform: "uppercase" },
  stationDetail: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  typeBadgeRun: { backgroundColor: colors.graphite },
  typeBadgeExo: { backgroundColor: "rgba(239,255,0,0.2)" },
  typeBadgeText: { fontFamily: fonts.bodyBold, fontSize: 8, color: colors.ash, letterSpacing: 2 },
  stationTime: { fontFamily: fonts.mono, fontSize: 13, fontWeight: "600", color: colors.silver },

  // Active mode (keep existing)
  stationActive: { backgroundColor: colors.carbon, borderColor: colors.neonYellow },
  activeGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.neonYellowDim, opacity: 0.5 },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center", zIndex: 1 },
  statusDone: { backgroundColor: colors.neonYellow },
  statusActiveCir: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.neonYellow },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neonYellow },
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
