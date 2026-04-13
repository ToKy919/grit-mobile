/**
 * GRIT — PROGRESS SCREEN (Production)
 * Real computed stats from workout history.
 * Weekly chart, PRs, session history — NO mock data.
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconStats, IconStar, IconPace, IconTimer, IconHyrox } from "../components/Icons";
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

  // ─── Empty State ────────────────────────────────
  if (completed.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.label}>PERFORMANCE</Text>
        <Text style={styles.heroTitle}>YOUR GRIT</Text>
        <View style={styles.emptyContent}>
          <IconStats size={48} color={colors.ash} />
          <Text style={styles.emptyText}>Complete your first workout to see your performance stats.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>PERFORMANCE</Text>
      <Text style={styles.heroTitle}>YOUR GRIT</Text>

      {/* Top Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>SESSIONS</Text>
          <Text style={styles.statValue}>{completed.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CONSISTENCY</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.statValue}>{consistency}</Text>
            <Text style={styles.statSuffix}>%</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>VOLUME</Text>
          <Text style={[styles.statValue, { fontSize: 20 }]}>{formatDuration(totalVolume)}</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.weekSection}>
        <View style={styles.weekHeader}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <Text style={styles.weekCount}>{activeDays} / 7 DAYS</Text>
        </View>
        <View style={styles.weekChart}>
          {weekActivity.map((val, i) => {
            const isToday = i === todayIndex;
            const barHeight = Math.max(4, (val / maxWeek) * 60);
            return (
              <View key={`d${i}`} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: val > 0 ? barHeight : 4,
                      backgroundColor: val > 0 ? (isToday ? colors.neonYellow : colors.steel) : colors.graphite,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold }]}>{weekDays[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Streak */}
      {streak > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{streak} DAY STREAK</Text>
            <Text style={styles.streakDesc}>Keep going. Consistency builds champions.</Text>
          </View>
        </View>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <View style={styles.prSection}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {personalRecords.map((pr) => (
            <View key={pr.category} style={styles.prRow}>
              <View style={styles.prIcon}>
                <IconStar size={14} color={colors.neonYellow} />
              </View>
              <Text style={styles.prLabel}>{pr.category}</Text>
              <Text style={styles.prValue}>
                {pr.unit === "time" ? formatTime(pr.value, true) : String(pr.value)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Sessions */}
      <View style={styles.historySection}>
        <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
        {completed.slice(0, 10).map((session) => {
          const isRun = session.type === "run";
          const isWod = session.type === "wod";
          const isHyrox = session.type === "hyrox";

          return (
            <View key={session.id} style={styles.historyRow}>
              <View style={styles.historyIcon}>
                {isRun && <IconPace size={16} color={colors.neonYellow} />}
                {isWod && <IconTimer size={16} color={colors.neonYellow} />}
                {isHyrox && <IconHyrox size={16} color={colors.neonYellow} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyType}>
                  {isRun ? "COURSE" : isWod ? "WOD" : "HYROX"}
                </Text>
                <Text style={styles.historyDate}>{formatRelativeDate(session.startedAt)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.historyDuration}>{formatTime(session.totalDurationMs)}</Text>
                {isRun && (
                  <Text style={styles.historyDetail}>
                    {formatDistance((session as RunSession).totalDistanceM)} km · {formatPace((session as RunSession).avgPaceSecPerKm)}/km
                  </Text>
                )}
                {isWod && (
                  <Text style={styles.historyDetail}>{(session as WodSession).totalReps} reps</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 42, color: colors.offWhite, marginBottom: spacing.lg },

  emptyContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center", paddingHorizontal: 40 },

  // Stats Grid
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 6 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 28, color: colors.offWhite },
  statSuffix: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, marginLeft: 2 },

  // Week
  weekSection: { marginBottom: spacing.lg },
  weekHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4 },
  weekCount: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow },
  weekChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  bar: { width: "65%", borderRadius: 4, maxWidth: 32 },
  dayLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },

  // Streak
  streakCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "rgba(239,255,0,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,255,0,0.15)", padding: spacing.md, marginBottom: spacing.lg },
  streakEmoji: { fontSize: 28 },
  streakValue: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.neonYellow, letterSpacing: 2 },
  streakDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },

  // PRs
  prSection: { marginBottom: spacing.lg },
  prRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, marginTop: 6 },
  prIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(239,255,0,0.1)", alignItems: "center", justifyContent: "center" },
  prLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.silver, letterSpacing: 1, flex: 1 },
  prValue: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.offWhite },

  // History
  historySection: { marginBottom: spacing.lg },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  historyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,255,0,0.08)", alignItems: "center", justifyContent: "center" },
  historyType: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.offWhite, letterSpacing: 1 },
  historyDate: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  historyDuration: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite },
  historyDetail: { fontFamily: fonts.body, fontSize: 11, color: colors.ash, marginTop: 2 },
});
