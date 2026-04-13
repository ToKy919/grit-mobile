/**
 * GRIT — HOME SCREEN (Production)
 * "Daily War Room" — Real data from workout history.
 * Shows last session, streak, PR trends, quick actions.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconUser, IconArrowRight, IconPace, IconTimer, IconHyrox, IconFire, IconStats } from "../components/Icons";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { getStreak, getWeekActivity, getConsistency, getTotalVolume } from "../utils/dateUtils";
import { formatTime, formatDistance, formatPace, formatRelativeDate, formatDuration } from "../utils/formatters";
import type { RunSession, WodSession, WorkoutSession } from "../types/workout";
import Svg, { Rect as SvgRect } from "react-native-svg";

interface HomeScreenProps {
  onStartSession?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const insets = useSafeAreaInsets();
  const sessions = useWorkoutHistoryStore((s) => s.sessions);
  const personalRecords = useWorkoutHistoryStore((s) => s.personalRecords);

  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const weekActivity = useMemo(() => getWeekActivity(sessions), [sessions]);
  const totalSessions = sessions.filter((s) => s.status === "completed").length;
  const consistency = useMemo(() => getConsistency(sessions), [sessions]);

  const lastSession = sessions.find((s) => s.status === "completed");
  const lastRun = sessions.find((s) => s.type === "run" && s.status === "completed") as RunSession | undefined;

  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? "MORNING" : hours < 18 ? "AFTERNOON" : "EVENING";
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const todayIndex = (now.getDay() + 6) % 7; // Mon=0

  // ─── Empty State ────────────────────────────────
  if (totalSessions === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.timeLabel}>{timeStr}</Text>
          <View style={styles.avatar}><IconUser size={16} color={colors.offWhite} /></View>
        </View>
        <View style={styles.divider} />
        <View style={styles.emptyContent}>
          <IconFire size={48} color={colors.ash} />
          <Text style={styles.emptyTitle}>WELCOME TO GRIT</Text>
          <Text style={styles.emptyDesc}>Start your first workout to see your stats, PRs, and training insights here.</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={onStartSession} activeOpacity={0.85}>
            <Text style={styles.ctaText}>START FIRST SESSION</Text>
            <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main Dashboard ─────────────────────────────
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.timeLabel}>{timeStr}</Text>
        <View style={styles.avatar}><IconUser size={16} color={colors.offWhite} /></View>
      </View>
      <View style={styles.divider} />

      {/* Greeting + Streak */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingLabel}>GOOD {greeting}</Text>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <IconFire size={14} color={colors.neonYellow} />
            <Text style={styles.streakText}>{streak} DAY STREAK</Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickValue}>{totalSessions}</Text>
          <Text style={styles.quickLabel}>SESSIONS</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickValue}>{consistency}%</Text>
          <Text style={styles.quickLabel}>CONSISTENCY</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickValue}>{formatDuration(getTotalVolume(sessions))}</Text>
          <Text style={styles.quickLabel}>VOLUME</Text>
        </View>
      </View>

      {/* Week Activity Mini Chart */}
      <View style={styles.weekSection}>
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.weekChart}>
          {weekActivity.map((count, i) => {
            const isToday = i === todayIndex;
            const hasActivity = count > 0;
            return (
              <View key={`d${i}`} style={styles.weekDay}>
                <View style={[styles.weekDot, hasActivity && styles.weekDotActive, isToday && styles.weekDotToday]} />
                <Text style={[styles.weekDayLabel, isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold }]}>{weekDays[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Last Session Card */}
      {lastSession && (
        <View style={styles.lastSessionCard}>
          <Text style={styles.sectionLabel}>LAST SESSION</Text>
          <View style={styles.lastSessionContent}>
            <View style={styles.lastSessionIcon}>
              {lastSession.type === "run" ? <IconPace size={20} color={colors.neonYellow} /> : lastSession.type === "hyrox" ? <IconHyrox size={20} color={colors.neonYellow} /> : <IconTimer size={20} color={colors.neonYellow} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lastSessionType}>
                {lastSession.type === "run" ? "COURSE" : lastSession.type === "hyrox" ? "HYROX" : "WOD"}
              </Text>
              <Text style={styles.lastSessionTime}>{formatRelativeDate(lastSession.startedAt)}</Text>
              <View style={styles.lastSessionStats}>
                <Text style={styles.lastSessionStat}>{formatTime(lastSession.totalDurationMs, true)}</Text>
                {lastSession.type === "run" && (
                  <>
                    <Text style={styles.lastSessionDot}>·</Text>
                    <Text style={styles.lastSessionStat}>{formatDistance((lastSession as RunSession).totalDistanceM)} km</Text>
                    <Text style={styles.lastSessionDot}>·</Text>
                    <Text style={[styles.lastSessionStat, { color: colors.neonYellow }]}>{formatPace((lastSession as RunSession).avgPaceSecPerKm)} /km</Text>
                  </>
                )}
                {lastSession.type === "wod" && (
                  <>
                    <Text style={styles.lastSessionDot}>·</Text>
                    <Text style={styles.lastSessionStat}>{(lastSession as WodSession).totalReps} reps</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* PRs */}
      {personalRecords.length > 0 && (
        <View style={styles.prSection}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {personalRecords.slice(0, 4).map((pr) => (
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

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={onStartSession} activeOpacity={0.85}>
        <Text style={styles.ctaText}>START SESSION</Text>
        <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

// Missing import fix
import { IconStar } from "../components/Icons";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  timeLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: colors.graphite, marginBottom: spacing.lg },

  // Empty
  emptyContent: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  emptyTitle: { fontFamily: fonts.headline, fontSize: 28, color: colors.offWhite },
  emptyDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  // Greeting
  greetingBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  greetingLabel: { fontFamily: fonts.headline, fontSize: 28, color: colors.offWhite },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239,255,0,0.08)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "rgba(239,255,0,0.2)" },
  streakText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 2 },

  // Quick Stats
  quickStats: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quickStat: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 6 },
  quickValue: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.offWhite },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },

  // Week
  weekSection: { marginBottom: spacing.lg },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  weekChart: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 8 },
  weekDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.graphite },
  weekDotActive: { backgroundColor: colors.neonYellow, borderColor: colors.neonYellow },
  weekDotToday: { borderColor: colors.offWhite, borderWidth: 2 },
  weekDayLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },

  // Last Session
  lastSessionCard: { backgroundColor: colors.carbon, borderRadius: 12, borderWidth: 1, borderColor: colors.graphite, padding: spacing.md, marginBottom: spacing.lg },
  lastSessionContent: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  lastSessionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239,255,0,0.1)", alignItems: "center", justifyContent: "center" },
  lastSessionType: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.offWhite, letterSpacing: 2 },
  lastSessionTime: { fontFamily: fonts.body, fontSize: 12, color: colors.ash, marginBottom: 4 },
  lastSessionStats: { flexDirection: "row", alignItems: "center" },
  lastSessionStat: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.silver },
  lastSessionDot: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, marginHorizontal: 6 },

  // PRs
  prSection: { marginBottom: spacing.lg },
  prRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  prCategory: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.silver, flex: 1 },
  prValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.offWhite },

  // CTA
  ctaButton: { backgroundColor: colors.neonYellow, paddingVertical: 18, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 4 },
});
