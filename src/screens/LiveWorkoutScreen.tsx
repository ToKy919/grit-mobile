/**
 * GRIT — LIVE WORKOUT SCREEN (React Native)
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconPause, IconStop, IconHeart, IconPace, IconFire } from "../components/Icons";

export const LiveWorkoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(764);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.activeLabel}>ACTIVE SESSION</Text>
        <View style={styles.recRow}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>REC</Text>
        </View>
      </View>

      {/* Giant Timer */}
      <View style={styles.timerBlock}>
        <Text style={styles.timerText}>{timeStr}</Text>
        <Text style={styles.timerLabel}>ELAPSED TIME</Text>
      </View>

      {/* Current Station */}
      <View style={styles.stationCard}>
        <View>
          <Text style={styles.stationSub}>STATION 3 OF 8</Text>
          <Text style={styles.stationTitle}>Burpees</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.stationSub}>REPS</Text>
          <Text style={styles.repsCount}>48</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        {[
          { icon: <IconPace size={14} color={colors.silver} />, label: "PACE", value: "4:32", sub: "/km" },
          { icon: <IconHeart size={14} color={colors.danger} />, label: "BPM", value: "167", sub: "ZONE 4", subColor: colors.danger },
          { icon: <IconFire size={14} color={colors.warning} />, label: "CAL", value: "342", sub: "kcal" },
        ].map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <View style={styles.metricHeader}>{m.icon}<Text style={styles.metricLabel}>{m.label}</Text></View>
            <Text style={styles.metricVal}>{m.value}</Text>
            <Text style={[styles.metricSub, m.subColor ? { color: m.subColor } : {}]}>{m.sub}</Text>
          </View>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsRunning(!isRunning)}>
          <IconPause size={22} color={colors.offWhite} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.stopBtn}>
          <IconStop size={24} color={colors.offWhite} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xxl },
  activeLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3 },
  recRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  recText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.danger, letterSpacing: 2 },
  timerBlock: { alignItems: "center", marginBottom: spacing.xxl },
  timerText: { fontFamily: fonts.mono, fontSize: 88, fontWeight: "700", color: colors.offWhite, letterSpacing: -4 },
  timerLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash, letterSpacing: 6, marginTop: spacing.xs },
  stationCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.graphite, paddingVertical: spacing.lg, marginBottom: spacing.xxl },
  stationSub: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash, letterSpacing: 4, marginBottom: 6 },
  stationTitle: { fontFamily: fonts.headline, fontSize: 28, color: colors.offWhite, textTransform: "uppercase" },
  repsCount: { fontFamily: fonts.mono, fontSize: 32, fontWeight: "700", color: colors.neonYellow },
  metricsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xxl },
  metricCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 4 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  metricVal: { fontFamily: fonts.mono, fontSize: 22, fontWeight: "700", color: colors.offWhite },
  metricSub: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32 },
  pauseBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  stopBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" },
});
