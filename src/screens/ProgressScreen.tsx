/**
 * GRIT — PROGRESS SCREEN (React Native)
 */

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";

const weekData = [0.6, 0.8, 0.4, 1.0, 0.7, 0.9, 0.3];
const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

const prs = [
  { label: "5K RUN", value: "21:34", trend: "-0:42", positive: true },
  { label: "SLED PUSH", value: "01:12", trend: "-0:08", positive: true },
  { label: "HYROX SIM", value: "01:08:22", trend: "-3:15", positive: true },
  { label: "WALL BALLS", value: "03:44", trend: "+0:12", positive: false },
];

export const ProgressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.label}>PERFORMANCE</Text>
      <Text style={styles.heroTitle}>YOUR GRIT</Text>

      {/* Top Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: "SESSIONS", value: "47" },
          { label: "CONSISTENCY", value: "87", suffix: "%" },
          { label: "VOLUME", value: "12", suffix: "H" },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={styles.statValue}>{s.value}</Text>
              {s.suffix && <Text style={styles.statSuffix}>{s.suffix}</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* Weekly Chart */}
      <View style={styles.weekSection}>
        <View style={styles.weekHeader}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.weekCount}>5 / 7 DAYS</Text>
        </View>
        <View style={styles.weekChart}>
          {weekData.map((val, i) => {
            const isToday = i === 3;
            return (
              <View key={`d${i}`} style={styles.barCol}>
                <View style={[styles.bar, { height: val * 60, backgroundColor: isToday ? colors.neonYellow : colors.graphite }]} />
                <Text style={[styles.dayLabel, isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold }]}>{weekDays[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* PRs */}
      <View style={styles.prSection}>
        <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
        {prs.map((pr) => (
          <View key={pr.label} style={styles.prRow}>
            <Text style={styles.prLabel}>{pr.label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Text style={styles.prValue}>{pr.value}</Text>
              <Text style={[styles.prTrend, { color: pr.positive ? colors.neonYellow : colors.danger }]}>{pr.trend}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 42, color: colors.offWhite, textTransform: "uppercase", marginBottom: spacing.lg },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 6 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  statValue: { fontFamily: fonts.mono, fontSize: 28, fontWeight: "700", color: colors.offWhite },
  statSuffix: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, marginLeft: 2 },
  weekSection: { marginBottom: spacing.lg },
  weekHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  weekCount: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow },
  weekChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  bar: { width: "70%", borderRadius: 4, maxWidth: 36 },
  dayLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },
  prSection: { marginBottom: spacing.lg },
  prRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, marginTop: 6 },
  prLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.silver, letterSpacing: 1 },
  prValue: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", color: colors.offWhite },
  prTrend: { fontFamily: fonts.mono, fontSize: 12, fontWeight: "700", minWidth: 48, textAlign: "right" },
});
