/**
 * GRIT — RUN TRACKER SCREEN (Production)
 *
 * REAL GPS tracking via expo-location.
 * REAL distance (Haversine), pace, splits, elevation.
 * NO mock data. NO default values.
 */

import React, { useEffect, useCallback, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import Svg, { Polyline, Circle, Line, G, Text as SvgText } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import { IconLocation, IconPace, IconElevation, IconTimer, IconPause, IconStop } from "../components/Icons";
import { useGpsTracking } from "../hooks/useGpsTracking";
import { useRunTrackerStore } from "../stores/useRunTrackerStore";
import { useActiveWorkoutStore } from "../stores/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { useTimer } from "../hooks/useTimer";
import { formatTime, formatPace, formatDistance, formatDistanceUnit, formatElevation, formatSpeed } from "../utils/formatters";
import type { RunSession } from "../types/workout";
import { hapticService } from "../services/haptics/hapticService";
import { useEnvironment } from "../hooks/useEnvironment";
import { EnvironmentBanner } from "../components/EnvironmentBanner";
import { snapToRoads } from "../services/google/roadsService";
import { getElevations } from "../services/google/elevationService";
import { getLocationName } from "../services/google/geocodingService";

type RunPhase = "idle" | "running" | "paused" | "finished";

export const RunTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [envExpanded, setEnvExpanded] = useState(false);

  // GPS
  const gps = useGpsTracking();
  const gpsState = useRunTrackerStore();

  // Timer
  const timer = useTimer({ mode: "stopwatch" });

  // Workout session
  const activeWorkout = useActiveWorkoutStore();
  const addSession = useWorkoutHistoryStore((s) => s.addSession);

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
            if (session) {
              const runSession: RunSession = {
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
              addSession(runSession);
            }

            hapticService.workoutFinished();
            gps.reset();
            setPhase("finished");

            setTimeout(() => setPhase("idle"), 2000);
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

  // ─── Map Rendering ──────────────────────────────
  const renderMap = () => {
    const points = gpsState.trackPoints;
    if (points.length < 2) {
      return (
        <View style={styles.mapEmpty}>
          <IconLocation size={24} color={colors.ash} />
          <Text style={styles.mapEmptyText}>
            {phase === "idle" ? "START A RUN TO SEE YOUR ROUTE" : "ACQUIRING GPS..."}
          </Text>
        </View>
      );
    }

    // Transform GPS coords to SVG viewbox
    const lats = points.map((p) => p.latitude);
    const lons = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const padding = 20;
    const svgW = 345;
    const svgH = 160;
    const rangeX = maxLon - minLon || 0.001;
    const rangeY = maxLat - minLat || 0.001;

    const toSvgX = (lon: number) => padding + ((lon - minLon) / rangeX) * (svgW - padding * 2);
    const toSvgY = (lat: number) => svgH - padding - ((lat - minLat) / rangeY) * (svgH - padding * 2);

    const polylinePoints = points.map((p) => `${toSvgX(p.longitude)},${toSvgY(p.latitude)}`).join(" ");
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    return (
      <Svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Grid */}
        {[0, 40, 80, 120, 160].map((y) => (
          <Line key={`h${y}`} x1={0} y1={y} x2={svgW} y2={y} stroke={colors.graphite} strokeWidth={0.5} opacity={0.3} />
        ))}

        {/* Route */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.neonYellow}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start marker */}
        <Circle cx={toSvgX(firstPoint.longitude)} cy={toSvgY(firstPoint.latitude)} r={4} fill="none" stroke={colors.offWhite} strokeWidth={1.5} />
        <Circle cx={toSvgX(firstPoint.longitude)} cy={toSvgY(firstPoint.latitude)} r={1.5} fill={colors.offWhite} />

        {/* Current position */}
        <Circle cx={toSvgX(lastPoint.longitude)} cy={toSvgY(lastPoint.latitude)} r={6} fill={colors.neonYellow} />
        <Circle cx={toSvgX(lastPoint.longitude)} cy={toSvgY(lastPoint.latitude)} r={10} fill="none" stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.4} />

        {/* Km markers from splits */}
        {gpsState.splits.map((split) => {
          const splitPoint = points.find((p) => p.timestamp >= split.endTimestamp);
          if (!splitPoint) return null;
          return (
            <G key={`km${split.kmIndex}`}>
              <Circle cx={toSvgX(splitPoint.longitude)} cy={toSvgY(splitPoint.latitude)} r={8} fill={colors.carbon} stroke={colors.steel} strokeWidth={1} />
              <SvgText
                x={toSvgX(splitPoint.longitude)}
                y={toSvgY(splitPoint.latitude) + 3.5}
                textAnchor="middle"
                fill={colors.offWhite}
                fontSize={8}
                fontWeight="600"
              >
                {split.kmIndex}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

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

  // ─── Idle State (before start) ─────────────────
  if (phase === "idle" || phase === "finished") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.idleContent}>
          <Text style={styles.idleLabel}>READY TO RUN</Text>
          <IconLocation size={48} color={colors.ash} />
          <Text style={styles.idleHint}>GPS tracking with live pace, distance, splits and elevation</Text>

          <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
            <Text style={styles.startButtonText}>START RUN</Text>
          </TouchableOpacity>

          {phase === "finished" && (
            <Text style={styles.savedLabel}>RUN SAVED</Text>
          )}
        </View>
      </View>
    );
  }

  // ─── Active / Paused State ─────────────────────
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
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

      {/* GPS Map — REAL track points */}
      <View style={styles.mapContainer}>
        {renderMap()}
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
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  // Idle state
  idleContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  idleLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ash, letterSpacing: 6 },
  idleHint: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  startButton: { backgroundColor: colors.neonYellow, paddingVertical: 20, paddingHorizontal: 64, borderRadius: 12 },
  startButtonText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.black, letterSpacing: 4 },
  savedLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.success, letterSpacing: 4 },
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
  mapContainer: { height: 160, borderRadius: 14, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, overflow: "hidden", marginBottom: spacing.sm },
  mapEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  mapEmptyText: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3 },
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
