/**
 * GRIT — PROGRESS SCREEN
 *
 * Never empty. Always shows the GRIT identity.
 * Real data when available, motivational state when not.
 * Premium editorial feel.
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconPace, IconTimer, IconHyrox, IconStar } from "../components/Icons";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { getStreak, getWeekActivity, getConsistency, getTotalVolume } from "../utils/dateUtils";
import { formatTime, formatDistance, formatPace, formatRelativeDate, formatDuration } from "../utils/formatters";
import type { RunSession, WodSession } from "../types/workout";

export const ProgressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const sessions = useWorkoutHistoryStore((s) => s.sessions);
  const personalRecords = useWorkoutHistoryStore((s) => s.personalRecords);

  const completed = useMemo(() => sessions.filter((s) => s.status === "completed"), [sessions]);
  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const weekActivity = useMemo(() => getWeekActivity(sessions), [sessions]);
  const consistency = useMemo(() => getConsistency(sessions), [sessions]);
  const totalVolume = useMemo(() => getTotalVolume(sessions), [sessions]);

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const maxWeek = Math.max(...weekActivity, 1);
  const activeDays = weekActivity.filter((d) => d > 0).length;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.label}>PERFORMANCE</Text>
      <Text style={styles.heroTitle}>YOUR{"\n"}GRIT</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>SESSIONS</Text>
          <Text style={styles.statValue}>{completed.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CONSISTENCY</Text>
          <Text style={styles.statValue}>{completed.length > 0 ? `${consistency}%` : "—"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>VOLUME</Text>
          <Text style={[styles.statValue, { fontSize: completed.length > 0 ? 20 : 28 }]}>
            {completed.length > 0 ? formatDuration(totalVolume) : "—"}
          </Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.sectionValue}>{activeDays} / 7</Text>
        </View>
        <View style={styles.weekChart}>
          {weekActivity.map((val, i) => {
            const isToday = i === todayIndex;
            return (
              <View key={`d${i}`} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (val / maxWeek) * 60),
                      backgroundColor: val > 0 ? (isToday ? colors.neonYellow : colors.steel) : colors.graphite,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold }]}>
                  {weekDays[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Streak */}
      {streak > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakValue}>{streak}</Text>
          <View>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
            <Text style={styles.streakDesc}>Consistency builds champions</Text>
          </View>
        </View>
      )}

      {/* PRs */}
      {personalRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {personalRecords.map((pr) => (
            <View key={pr.category} style={styles.prRow}>
              <IconStar size={14} color={colors.neonYellow} />
              <Text style={styles.prCategory}>{pr.category}</Text>
              <Text style={styles.prValue}>
                {pr.unit === "time" ? formatTime(pr.value, true) : String(pr.value)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* History */}
      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          {completed.slice(0, 8).map((session) => (
            <View key={session.id} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                {session.type === "run" && <IconPace size={14} color={colors.neonYellow} />}
                {session.type === "wod" && <IconTimer size={14} color={colors.neonYellow} />}
                {session.type === "hyrox" && <IconHyrox size={14} color={colors.neonYellow} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyType}>
                  {session.type === "run" ? "COURSE" : session.type === "hyrox" ? "HYROX" : "WOD"}
                </Text>
                <Text style={styles.historyDate}>{formatRelativeDate(session.startedAt)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.historyDuration}>{formatTime(session.totalDurationMs)}</Text>
                {session.type === "run" && (
                  <Text style={styles.historyDetail}>
                    {formatDistance((session as RunSession).totalDistanceM)} km
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty motivational message */}
      {completed.length === 0 && (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>NO EXCUSES</Text>
          <Text style={styles.emptyDesc}>Your first session will appear here. Every rep counts.</Text>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },

  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4 },
  heroTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", lineHeight: 48, marginTop: spacing.xs, marginBottom: spacing.lg },

  // Stats
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 6 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 28, color: colors.offWhite },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  sectionValue: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow },

  // Week chart
  weekChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  bar: { width: "65%", borderRadius: 4, maxWidth: 32 },
  dayLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },

  // Streak
  streakCard: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: "rgba(239,255,0,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,255,0,0.15)", padding: spacing.lg, marginBottom: spacing.lg },
  streakValue: { fontFamily: fonts.headline, fontSize: 48, color: colors.neonYellow },
  streakLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.neonYellow, letterSpacing: 3 },
  streakDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, marginTop: 2 },

  // PRs
  prRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  prCategory: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.silver, flex: 1 },
  prValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.offWhite },

  // History
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,255,0,0.08)", alignItems: "center", justifyContent: "center" },
  historyType: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.offWhite, letterSpacing: 1 },
  historyDate: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  historyDuration: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite },
  historyDetail: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 2 },

  // Empty
  emptyBlock: { alignItems: "center", paddingVertical: spacing.xxl },
  emptyTitle: { fontFamily: fonts.headline, fontSize: 32, color: colors.graphite, textTransform: "uppercase", marginBottom: spacing.sm },
  emptyDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center" },
});
