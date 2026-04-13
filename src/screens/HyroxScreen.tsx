/**
 * GRIT — HYROX MODE SCREEN (React Native)
 */

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconCheck, IconLock } from "../components/Icons";

interface Station {
  name: string;
  detail: string;
  status: "done" | "active" | "locked";
  time?: string;
}

const stations: Station[] = [
  { name: "RUN 1", detail: "1 KM", status: "done", time: "04:12" },
  { name: "SKI ERG", detail: "1000M", status: "done", time: "04:45" },
  { name: "RUN 2", detail: "1 KM", status: "done", time: "04:28" },
  { name: "SLED PUSH", detail: "50M", status: "active" },
  { name: "RUN 3", detail: "1 KM", status: "locked" },
  { name: "SLED PULL", detail: "50M", status: "locked" },
  { name: "RUN 4", detail: "1 KM", status: "locked" },
  { name: "BURPEES", detail: "80 REPS", status: "locked" },
];

export const HyroxScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const done = stations.filter((s) => s.status === "done").length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>HYROX RACE SIM</Text>
        <View style={styles.headerRow}>
          <Text style={styles.heroTitle}>ROXZONE</Text>
          <Text style={styles.timer}>13:25</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>RACE PROGRESS</Text>
          <Text style={styles.progressCount}>{done}/{stations.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(done / stations.length) * 100}%` }]} />
        </View>
      </View>

      {/* Stations */}
      <ScrollView style={styles.stationsList} showsVerticalScrollIndicator={false}>
        {stations.map((s) => {
          const isDone = s.status === "done";
          const isActive = s.status === "active";
          const isLocked = s.status === "locked";
          return (
            <View
              key={s.name}
              style={[
                styles.stationRow,
                isActive && styles.stationActive,
                isDone && styles.stationDone,
                isLocked && { opacity: 0.4 },
              ]}
            >
              {/* Active glow */}
              {isActive && <View style={styles.activeGlow} />}

              {/* Status circle */}
              <View style={[styles.statusCircle, isDone && styles.statusDone, isActive && styles.statusActiveCircle]}>
                {isDone && <IconCheck size={16} color={colors.black} strokeWidth={3} />}
                {isActive && <View style={styles.activeDot} />}
                {isLocked && <IconLock size={12} color={colors.ash} />}
              </View>

              {/* Info */}
              <View style={{ flex: 1, zIndex: 1 }}>
                <Text style={[styles.stationName, isActive && { color: colors.neonYellow }, isDone && { color: colors.offWhite }]}>{s.name}</Text>
                <Text style={styles.stationDetail}>{s.detail}</Text>
              </View>

              {/* Time or NOW */}
              {isDone && s.time && <Text style={styles.stationTime}>{s.time}</Text>}
              {isActive && <Text style={styles.nowBadge}>NOW</Text>}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  heroTitle: { fontFamily: fonts.headline, fontSize: 38, color: colors.offWhite, textTransform: "uppercase" },
  timer: { fontFamily: fonts.mono, fontSize: 28, fontWeight: "700", color: colors.offWhite },
  progressSection: { marginBottom: spacing.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  progressCount: { fontFamily: fonts.mono, fontSize: 12, fontWeight: "700", color: colors.neonYellow },
  progressTrack: { height: 4, backgroundColor: colors.graphite, borderRadius: 2 },
  progressFill: { height: "100%", backgroundColor: colors.neonYellow, borderRadius: 2 },
  stationsList: { flex: 1 },
  stationRow: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: "rgba(42,42,42,0.4)", gap: spacing.md, marginBottom: 6, overflow: "hidden" },
  stationActive: { backgroundColor: colors.carbon, borderColor: colors.neonYellow },
  stationDone: { borderColor: colors.graphite },
  activeGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.neonYellowDim, opacity: 0.5 },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.graphite, alignItems: "center", justifyContent: "center", zIndex: 1 },
  statusDone: { backgroundColor: colors.neonYellow },
  statusActiveCircle: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.neonYellow },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neonYellow },
  stationName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ash, letterSpacing: 1, textTransform: "uppercase" },
  stationDetail: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, letterSpacing: 1 },
  stationTime: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "600", color: colors.silver, zIndex: 1 },
  nowBadge: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 2, zIndex: 1 },
});
