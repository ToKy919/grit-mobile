/**
 * GRIT — RUN TRACKER SCREEN (React Native)
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polyline, Circle, Line, Rect, Path, G, Text as SvgText } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import { IconLocation, IconPace, IconHeart, IconTimer, IconFire, IconElevation, IconPause, IconStop } from "../components/Icons";

export const RunTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const distance = (elapsed * 0.0033).toFixed(2); // ~12 km/h simulation

  const splits = [
    { km: 1, pace: "4:48", trend: "\u2014" },
    { km: 2, pace: "4:55", trend: "+7s" },
    { km: 3, pace: "4:51", trend: "-4s" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.row}>
          <IconLocation size={14} color={colors.neonYellow} />
          <Text style={styles.gpsLabel}>GPS LOCKED</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.recDot} />
          <Text style={styles.recLabel}>RECORDING</Text>
        </View>
      </View>

      {/* Distance */}
      <View style={styles.distanceBlock}>
        <Text style={styles.distLabel}>DISTANCE</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={styles.distValue}>{distance}</Text>
          <Text style={styles.distUnit}>km</Text>
        </View>
      </View>

      {/* Time + Pace */}
      <View style={styles.timePaceRow}>
        <View>
          <Text style={styles.metricLabel}>TIME</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <IconTimer size={14} color={colors.silver} />
            <Text style={styles.metricValue}>{timeStr}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.metricLabel}>AVG PACE</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <IconPace size={14} color={colors.neonYellow} />
            <Text style={[styles.metricValue, { color: colors.neonYellow }]}>4:55</Text>
            <Text style={styles.paceUnit}>/km</Text>
          </View>
        </View>
      </View>

      {/* GPS Map */}
      <View style={styles.mapContainer}>
        <Svg width="100%" height="100%" viewBox="0 0 345 160">
          {/* Grid */}
          {[0, 40, 80, 120, 160].map((y) => (
            <Line key={`h${y}`} x1={0} y1={y} x2={345} y2={y} stroke={colors.graphite} strokeWidth={0.5} opacity={0.4} />
          ))}
          {/* Route */}
          <Polyline
            points="30,130 60,120 90,110 120,95 150,85 180,75 210,68 240,55 270,45 310,35"
            fill="none" stroke={colors.neonYellow} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round"
          />
          {/* Current position */}
          <Circle cx={310} cy={35} r={6} fill={colors.neonYellow} />
          <Circle cx={310} cy={35} r={10} fill="none" stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.4} />
          {/* Start */}
          <Circle cx={30} cy={130} r={4} fill="none" stroke={colors.offWhite} strokeWidth={1.5} />
          <Circle cx={30} cy={130} r={1.5} fill={colors.offWhite} />
          {/* Km markers */}
          {[{ x: 90, y: 110, k: "1" }, { x: 180, y: 75, k: "2" }, { x: 270, y: 45, k: "3" }].map((m) => (
            <G key={m.k}>
              <Circle cx={m.x} cy={m.y} r={8} fill={colors.carbon} stroke={colors.steel} strokeWidth={1} />
              <SvgText x={m.x} y={m.y + 3.5} textAnchor="middle" fill={colors.offWhite} fontSize={8} fontWeight="600">{m.k}</SvgText>
            </G>
          ))}
        </Svg>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {[
          { icon: <IconHeart size={14} color={colors.danger} />, label: "BPM", value: "158", sub: "ZONE 4", subColor: colors.danger },
          { icon: <IconElevation size={14} color={colors.neonYellow} />, label: "ELEV", value: "+87", sub: "METERS", subColor: colors.ash },
          { icon: <IconFire size={14} color="#F59E0B" />, label: "CAL", value: "384", sub: "KCAL", subColor: colors.ash },
        ].map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <View style={styles.row}>{m.icon}<Text style={styles.metricCardLabel}>{m.label}</Text></View>
            <Text style={styles.metricCardValue}>{m.value}</Text>
            <Text style={[styles.metricCardSub, { color: m.subColor }]}>{m.sub}</Text>
          </View>
        ))}
      </View>

      {/* Splits */}
      <View style={styles.splitsSection}>
        <Text style={styles.splitsTitle}>SPLIT TIMES</Text>
        {splits.map((s, i) => {
          const isLast = i === splits.length - 1;
          return (
            <View key={`s${s.km}`} style={[styles.splitRow, isLast && styles.splitRowActive]}>
              <Text style={styles.splitKm}>KM {s.km}</Text>
              <Text style={[styles.splitPace, isLast && { color: colors.neonYellow }]}>{s.pace}</Text>
              <Text style={[styles.splitTrend, s.trend.includes("+") && { color: colors.danger }, s.trend.includes("-") && { color: colors.success }]}>{s.trend}</Text>
            </View>
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setIsRunning(!isRunning)}>
          <IconPause size={22} color={colors.offWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopBtn}>
          <IconStop size={24} color={colors.offWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtnAccent}>
          <IconLocation size={20} color={colors.neonYellow} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  gpsLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 3 },
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
  metricsGrid: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  metricCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 4 },
  metricCardLabel: { fontFamily: fonts.bodyMedium, fontSize: 7, color: colors.ash, letterSpacing: 3 },
  metricCardValue: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "700", color: colors.offWhite },
  metricCardSub: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 2 },
  splitsSection: { marginBottom: spacing.sm },
  splitsTitle: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 4, marginBottom: 6 },
  splitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.graphite, marginBottom: 3 },
  splitRowActive: { borderColor: "rgba(239,255,0,0.15)", backgroundColor: "rgba(239,255,0,0.05)" },
  splitKm: { fontFamily: fonts.mono, fontSize: 11, fontWeight: "700", color: colors.ash, width: 40 },
  splitPace: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "700", color: colors.offWhite },
  splitTrend: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, width: 40, textAlign: "right" },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32, paddingBottom: spacing.sm },
  controlBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
  controlBtnAccent: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: colors.neonYellow, alignItems: "center", justifyContent: "center" },
});
