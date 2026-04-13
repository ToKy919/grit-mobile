/**
 * GRIT — RUN TRACKER SCREEN (Production)
 *
 * REAL GPS tracking via expo-location.
 * REAL distance (Haversine), pace, splits, elevation.
 * NO mock data. NO default values.
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import { IconLocation, IconPace, IconElevation, IconTimer, IconPause, IconStop, IconArrowRight, IconStats } from "../components/Icons";
import { FadeSlideUp } from "../components/Animated";
import { RunMap } from "../components/RunMap";
import { useGpsTracking } from "../hooks/useGpsTracking";
import { useRunTrackerStore } from "../stores/useRunTrackerStore";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { useTimer } from "../hooks/useTimer";
import { formatTime, formatPace, formatDistance, formatDistanceUnit, formatElevation, formatSpeed, formatRelativeDate } from "../utils/formatters";
import type { RunSession } from "../types/workout";
import { hapticService } from "../services/haptics/hapticService";
import { useEnvironment } from "../hooks/useEnvironment";
import { EnvironmentBanner } from "../components/EnvironmentBanner";
import { snapToRoads } from "../services/google/roadsService";
import { getElevations } from "../services/google/elevationService";
import { getLocationName } from "../services/google/geocodingService";
import { RunSummaryScreen } from "./RunSummaryScreen";

type RunPhase = "idle" | "running" | "paused" | "summary";

export const RunTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [envExpanded, setEnvExpanded] = useState(false);
  const [completedSession, setCompletedSession] = useState<RunSession | null>(null);

  // GPS
  const gps = useGpsTracking();
  const gpsState = useRunTrackerStore();

  // Timer
  const timer = useTimer({ mode: "stopwatch" });

  // Workout session
  const activeWorkout = useActiveWorkoutStore();
  const { addSession } = useWorkoutHistoryStore();

  // Environment (air quality + pollen)
  const env = useEnvironment();

  // ─── Start Run ──────────────────────────────────
  const handleStart = useCallback(async () => {
    const granted = await gps.start();
    if (!granted) {
      Alert.alert(
        "GPS Required",
        "GRIT needs location access to track your run. Please enable it in Settings.",
        [{ text: "OK" }]
      );
      return;
    }

    activeWorkout.startWorkout("run");
    timer.start();
    await activateKeepAwakeAsync();
    hapticService.medium();
    setPhase("running");

    // Start environment monitoring (air quality + pollen) in background
    // Use a small delay to get first GPS fix
    setTimeout(async () => {
      const state = useRunTrackerStore.getState();
      if (state.currentPoint) {
        env.startMonitoring(state.currentPoint.latitude, state.currentPoint.longitude);
      }
    }, 5000);
  }, [gps, activeWorkout, timer, env]);

  // ─── Pause / Resume ─────────────────────────────
  const handlePauseResume = useCallback(() => {
    if (phase === "running") {
      timer.pause();
      activeWorkout.pauseWorkout();
      hapticService.light();
      setPhase("paused");
    } else if (phase === "paused") {
      timer.resume();
      activeWorkout.resumeWorkout();
      hapticService.light();
      setPhase("running");
    }
  }, [phase, timer, activeWorkout]);

  // ─── Stop Run ───────────────────────────────────
  const handleStop = useCallback(() => {
    Alert.alert(
      "End Run?",
      `${formatDistance(gpsState.totalDistanceM)} ${formatDistanceUnit(gpsState.totalDistanceM)} in ${formatTime(timer.display.totalElapsedMs)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save & End",
          style: "destructive",
          onPress: async () => {
            const elapsedMs = timer.stop();
            gps.stop();
            env.stopMonitoring();
            deactivateKeepAwake();

            // Post-process: snap to roads + correct elevations (async, best-effort)
            let finalPoints = gpsState.trackPoints;
            let finalElevation = gpsState.elevationGainM;

            try {
              // Snap GPS points to nearest roads for accuracy
              const snapped = await snapToRoads(finalPoints);
              if (snapped.length > 0) finalPoints = snapped;

              // Get precise elevation data from Google
              const elevated = await getElevations(finalPoints);
              if (elevated.length > 0) {
                finalPoints = elevated;
                // Recalculate elevation gain with corrected data
                let gain = 0;
                let prevAlt: number | null = null;
                for (const p of elevated) {
                  if (p.altitude !== null && prevAlt !== null && p.altitude - prevAlt > 0.5) {
                    gain += p.altitude - prevAlt;
                  }
                  if (p.altitude !== null) prevAlt = p.altitude;
                }
                finalElevation = gain;
              }
            } catch (e) {
              // Best-effort — use original data if APIs fail
              console.warn("[RunTracker] Post-processing failed:", e);
            }

            // Get location name for session
            let locationName: string | undefined;
            try {
              if (finalPoints.length > 0) {
                const loc = await getLocationName(finalPoints[0].latitude, finalPoints[0].longitude);
                if (loc) locationName = `${loc.shortName}, ${loc.city}`;
              }
            } catch {}

            // Build RunSession
            const session = activeWorkout.completeWorkout();
            let finalRunSession: RunSession | null = null;

            if (session) {
              finalRunSession = {
                ...session,
                type: "run",
                totalDurationMs: elapsedMs,
                trackPoints: finalPoints,
                splits: gpsState.splits,
                totalDistanceM: gpsState.totalDistanceM,
                elevationGainM: finalElevation,
                avgPaceSecPerKm: gpsState.avgPaceSecPerKm,
                notes: locationName,
              };
              addSession(finalRunSession);
            }

            hapticService.workoutFinished();
            gps.reset();

            // Show summary screen with animated stats
            if (finalRunSession) {
              setCompletedSession(finalRunSession);
              setPhase("summary");
            } else {
              setPhase("idle");
            }
          },
        },
      ]
    );
  }, [timer, gps, gpsState, activeWorkout, addSession]);

  // Update elapsed in active workout store
  useEffect(() => {
    if (timer.isRunning) {
      activeWorkout.updateElapsed(timer.display.totalElapsedMs);
    }
  }, [timer.display.totalElapsedMs]);

  // ─── Summary Screen ─────────────────────────────
  if (phase === "summary" && completedSession) {
    return (
      <RunSummaryScreen
        session={completedSession}
        onDismiss={() => {
          setCompletedSession(null);
          setPhase("idle");
        }}
      />
    );
  }

  // ─── Signal Quality Label ──────────────────────
  const signalLabel = {
    searching: "SEARCHING...",
    weak: "GPS WEAK",
    good: "GPS GOOD",
    excellent: "GPS LOCKED",
  }[gpsState.signalQuality];

  const signalColor = {
    searching: colors.warning,
    weak: colors.warning,
    good: colors.neonYellow,
    excellent: colors.neonYellow,
  }[gpsState.signalQuality];

  // ─── Idle State — Map preview + position + history ─
  const { sessions: allSessions } = useWorkoutHistoryStore();
  const historyRuns = useMemo(() => allSessions.filter((ss) => ss.type === "run" && ss.status === "completed") as RunSession[], [allSessions]);
  const [showHistory, setShowHistory] = useState(false);

  if (phase === "idle") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Map preview area (takes top 50% of screen) */}
        <View style={styles.idleMapArea}>
          {/* Dark map placeholder with grid + current position dot */}
          <Svg width="100%" height="100%" viewBox="0 0 393 380">
            {/* Grid lines for map feel */}
            {[60, 120, 180, 240, 300, 360].map((y) => (
              <Line key={`h${y}`} x1={0} y1={y} x2={393} y2={y} stroke={colors.graphite} strokeWidth={0.5} opacity={0.2} />
            ))}
            {[60, 120, 180, 240, 300, 360].map((x) => (
              <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={380} stroke={colors.graphite} strokeWidth={0.5} opacity={0.2} />
            ))}

            {/* Current position pulse */}
            <Circle cx={197} cy={190} r={30} fill="none" stroke={colors.neonYellow} strokeWidth={1} opacity={0.1} />
            <Circle cx={197} cy={190} r={18} fill="none" stroke={colors.neonYellow} strokeWidth={1} opacity={0.2} />
            <Circle cx={197} cy={190} r={8} fill={colors.neonYellow} opacity={0.9} />
            <Circle cx={197} cy={190} r={12} fill="none" stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.4} />

            {/* Crosshair */}
            <Line x1={197} y1={170} x2={197} y2={178} stroke={colors.ash} strokeWidth={1} opacity={0.3} />
            <Line x1={197} y1={202} x2={197} y2={210} stroke={colors.ash} strokeWidth={1} opacity={0.3} />
            <Line x1={177} y1={190} x2={185} y2={190} stroke={colors.ash} strokeWidth={1} opacity={0.3} />
            <Line x1={209} y1={190} x2={217} y2={190} stroke={colors.ash} strokeWidth={1} opacity={0.3} />
          </Svg>

          {/* GPS status overlay */}
          <View style={styles.idleGpsOverlay}>
            <IconLocation size={12} color={colors.neonYellow} />
            <Text style={styles.idleGpsText}>GPS READY</Text>
          </View>

          {/* Gradient fade at bottom */}
          <LinearGradient
            colors={["transparent", colors.black]}
            style={styles.idleMapGradient}
          />
        </View>

        {/* Bottom content */}
        <View style={styles.idleBottom}>
          {/* Stats from last run (if any) */}
          {historyRuns.length > 0 && (
            <FadeSlideUp delay={100}>
              <View style={styles.lastRunRow}>
                <View>
                  <Text style={styles.lastRunLabel}>LAST RUN</Text>
                  <Text style={styles.lastRunValue}>
                    {formatDistance((historyRuns[0] as RunSession).totalDistanceM)} km · {formatPace((historyRuns[0] as RunSession).avgPaceSecPerKm)}/km
                  </Text>
                </View>
                <Text style={styles.lastRunTime}>
                  {formatTime(historyRuns[0].totalDurationMs)}
                </Text>
              </View>
            </FadeSlideUp>
          )}

          {/* START button — prominent */}
          <FadeSlideUp delay={200}>
            <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
              <Text style={styles.startButtonText}>START RUN</Text>
              <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </FadeSlideUp>
        </View>

        {/* Floating history button */}
        {historyRuns.length > 0 && (
          <TouchableOpacity
            style={[styles.historyFab, { bottom: insets.bottom + 100 }]}
            onPress={() => setShowHistory(!showHistory)}
            activeOpacity={0.7}
          >
            <IconStats size={18} color={colors.offWhite} />
            <Text style={styles.historyFabText}>{historyRuns.length}</Text>
          </TouchableOpacity>
        )}

        {/* History panel (slides up on tap) */}
        {showHistory && historyRuns.length > 0 && (
          <View style={[styles.historyPanel, { bottom: insets.bottom + 150 }]}>
            <Text style={styles.historyTitle}>PREVIOUS RUNS</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {historyRuns.slice(0, 5).map((run) => (
                <View key={run.id} style={styles.historyItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyItemDate}>{formatRelativeDate(run.startedAt)}</Text>
                    <Text style={styles.historyItemStats}>
                      {formatDistance((run as RunSession).totalDistanceM)} km · {formatPace((run as RunSession).avgPaceSecPerKm)}/km
                    </Text>
                  </View>
                  <Text style={styles.historyItemTime}>{formatTime(run.totalDurationMs)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // ─── Active / Paused State ─────────────────────
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 12, paddingHorizontal: spacing.lg }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.row}>
          <IconLocation size={14} color={signalColor} />
          <Text style={[styles.gpsLabel, { color: signalColor }]}>{signalLabel}</Text>
        </View>
        {phase === "running" && (
          <View style={styles.row}>
            <View style={styles.recDot} />
            <Text style={styles.recLabel}>RECORDING</Text>
          </View>
        )}
        {phase === "paused" && (
          <Text style={[styles.recLabel, { color: colors.warning }]}>PAUSED</Text>
        )}
      </View>

      {/* Environment Banner — Air Quality + Pollen (real data from Google) */}
      <EnvironmentBanner
        airQuality={env.airQuality}
        pollen={env.pollen}
        warning={env.warning}
        expanded={envExpanded}
        onToggle={() => setEnvExpanded(!envExpanded)}
      />

      {/* Distance — REAL from GPS */}
      <View style={styles.distanceBlock}>
        <Text style={styles.distLabel}>DISTANCE</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={styles.distValue}>
            {formatDistance(gpsState.totalDistanceM)}
          </Text>
          <Text style={styles.distUnit}>{formatDistanceUnit(gpsState.totalDistanceM)}</Text>
        </View>
      </View>

      {/* Time + Pace — REAL */}
      <View style={styles.timePaceRow}>
        <View>
          <Text style={styles.metricLabel}>TIME</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <IconTimer size={14} color={colors.silver} />
            <Text style={styles.metricValue}>
              {formatTime(timer.display.totalElapsedMs)}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.metricLabel}>AVG PACE</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <IconPace size={14} color={colors.neonYellow} />
            <Text style={[styles.metricValue, { color: colors.neonYellow }]}>
              {formatPace(gpsState.avgPaceSecPerKm)}
            </Text>
            <Text style={styles.paceUnit}>/km</Text>
          </View>
        </View>
      </View>

      {/* GPS Map — Real Google Maps or SVG fallback */}
      <View style={{ marginBottom: spacing.sm }}>
        <RunMap
          trackPoints={gpsState.trackPoints}
          splits={gpsState.splits}
          isLive={true}
          height={180}
        />
      </View>

      {/* Metrics — REAL data only (no BPM without HR sensor) */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.row}>
            <IconPace size={14} color={colors.neonYellow} />
            <Text style={styles.metricCardLabel}>PACE</Text>
          </View>
          <Text style={styles.metricCardValue}>
            {formatPace(gpsState.currentPaceSecPerKm)}
          </Text>
          <Text style={styles.metricCardSub}>/KM</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.row}>
            <IconElevation size={14} color={colors.neonYellow} />
            <Text style={styles.metricCardLabel}>ELEV</Text>
          </View>
          <Text style={styles.metricCardValue}>
            {formatElevation(gpsState.elevationGainM)}
          </Text>
          <Text style={styles.metricCardSub}>METERS</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.row}>
            <IconTimer size={14} color={colors.silver} />
            <Text style={styles.metricCardLabel}>SPEED</Text>
          </View>
          <Text style={styles.metricCardValue}>
            {formatSpeed(gpsState.currentSpeed)}
          </Text>
          <Text style={styles.metricCardSub}>KM/H</Text>
        </View>
      </View>

      {/* Splits — REAL auto-detected every 1km */}
      {gpsState.splits.length > 0 && (
        <View style={styles.splitsSection}>
          <Text style={styles.splitsTitle}>SPLIT TIMES</Text>
          {gpsState.splits.map((split, i) => {
            const isLast = i === gpsState.splits.length - 1;
            const prevPace = i > 0 ? gpsState.splits[i - 1].paceSecPerKm : null;
            const diff = prevPace ? split.paceSecPerKm - prevPace : 0;
            const trendStr = prevPace
              ? (diff > 0 ? `+${Math.abs(Math.round(diff))}s` : diff < 0 ? `-${Math.abs(Math.round(diff))}s` : "\u2014")
              : "\u2014";

            return (
              <View key={`km${split.kmIndex}`} style={[styles.splitRow, isLast && styles.splitRowActive]}>
                <Text style={styles.splitKm}>KM {split.kmIndex}</Text>
                <Text style={[styles.splitPace, isLast && { color: colors.neonYellow }]}>
                  {formatPace(split.paceSecPerKm)}
                </Text>
                <Text
                  style={[
                    styles.splitTrend,
                    trendStr.includes("+") && { color: colors.danger },
                    trendStr.includes("-") && { color: colors.success },
                  ]}
                >
                  {trendStr}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handlePauseResume}>
          <IconPause size={22} color={colors.offWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
          <IconStop size={24} color={colors.offWhite} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },

  // Idle — Map preview
  idleMapArea: { flex: 1, backgroundColor: colors.carbon, position: "relative" },
  idleGpsOverlay: { position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(10,10,10,0.8)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.graphite },
  idleGpsText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 3 },
  idleMapGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 100 },

  idleBottom: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  lastRunRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.carbon, borderRadius: 12, borderWidth: 1, borderColor: colors.graphite, padding: spacing.md, marginBottom: spacing.md },
  lastRunLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3, marginBottom: 4 },
  lastRunValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite },
  lastRunTime: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", color: colors.neonYellow },

  startButton: { backgroundColor: colors.neonYellow, paddingVertical: 20, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, shadowColor: colors.neonYellow, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  startButtonText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.black, letterSpacing: 4 },

  historyFab: { position: "absolute", right: spacing.lg, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  historyFabText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.neonYellow, marginTop: 2 },

  historyPanel: { position: "absolute", right: spacing.lg, left: spacing.lg, backgroundColor: colors.carbon, borderRadius: 14, borderWidth: 1, borderColor: colors.graphite, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  historyTitle: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  historyItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  historyItemDate: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  historyItemStats: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.offWhite, marginTop: 2 },
  historyItemTime: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.silver },
  // Active state
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  gpsLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 3 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  recLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.danger, letterSpacing: 2 },
  distanceBlock: { marginBottom: spacing.sm },
  distLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash, letterSpacing: 4 },
  distValue: { fontFamily: fonts.mono, fontSize: 52, fontWeight: "700", color: colors.offWhite, letterSpacing: -2 },
  distUnit: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ash, marginLeft: 6 },
  timePaceRow: { flexDirection: "row", gap: 40, marginBottom: spacing.md },
  metricLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  metricValue: { fontFamily: fonts.mono, fontSize: 20, fontWeight: "700", color: colors.offWhite },
  paceUnit: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  metricsGrid: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  metricCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 4 },
  metricCardLabel: { fontFamily: fonts.bodyMedium, fontSize: 7, color: colors.ash, letterSpacing: 3 },
  metricCardValue: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "700", color: colors.offWhite },
  metricCardSub: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 2, color: colors.ash },
  splitsSection: { marginBottom: spacing.sm },
  splitsTitle: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 4, marginBottom: 6 },
  splitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.graphite, marginBottom: 3 },
  splitRowActive: { borderColor: "rgba(239,255,0,0.15)", backgroundColor: "rgba(239,255,0,0.05)" },
  splitKm: { fontFamily: fonts.mono, fontSize: 11, fontWeight: "700", color: colors.ash, width: 40 },
  splitPace: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.offWhite },
  splitTrend: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, width: 40, textAlign: "right" },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32, paddingBottom: spacing.sm },
  controlBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
});
