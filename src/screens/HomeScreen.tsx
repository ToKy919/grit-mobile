/**
 * GRIT — HOME SCREEN "DAILY WAR ROOM"
 *
 * Premium editorial design. Never empty.
 * Shows real data when available, smart suggestions when not.
 * Massive serif headlines. GRIT identity.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconUser, IconArrowRight, IconPace, IconTimer, IconHyrox, IconFire, IconStar } from "../components/Icons";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { getStreak, getWeekActivity } from "../utils/dateUtils";
import { formatTime, formatDistance, formatPace, formatRelativeDate } from "../utils/formatters";
import type { RunSession, WodSession } from "../types/workout";
import Svg, { Rect as SvgRect } from "react-native-svg";

interface HomeScreenProps {
  onStartSession?: () => void;
}

// Suggested sessions rotation
const SUGGESTED_SESSIONS = [
  { title: "HYROX\nSIMULATION", items: ["8 × 1KM RUN", "SLED PUSH · 4 SETS", "BURPEE BROAD JUMP", "WALL BALLS · 75 REPS"], type: "hyrox" },
  { title: "TEMPO\nRUN", items: ["5KM AT THRESHOLD", "AVG PACE TARGET", "NEGATIVE SPLIT"], type: "run" },
  { title: "AMRAP\n20 MIN", items: ["15 WALL BALLS", "10 BURPEES", "200M RUN"], type: "wod" },
  { title: "INTERVAL\nSESSION", items: ["8 × 400M", "90S REST BETWEEN", "MAX EFFORT"], type: "run" },
  { title: "EMOM\n12 MIN", items: ["MIN 1: 15 KB SWINGS", "MIN 2: 12 BOX JUMPS", "MIN 3: 200M RUN"], type: "wod" },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const insets = useSafeAreaInsets();
  const sessions = useWorkoutHistoryStore((s) => s.sessions);
  const personalRecords = useWorkoutHistoryStore((s) => s.personalRecords);

  const completed = sessions.filter((s) => s.status === "completed");
  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const weekActivity = useMemo(() => getWeekActivity(sessions), [sessions]);
  const lastSession = completed[0];
  const lastRun = completed.find((s) => s.type === "run") as RunSession | undefined;

  // Pick a suggested session based on day of week
  const dayIndex = new Date().getDay();
  const suggested = SUGGESTED_SESSIONS[dayIndex % SUGGESTED_SESSIONS.length];

  const now = new Date();
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
  const todayIndex = (now.getDay() + 6) % 7;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.timeLabel}>{timeStr}</Text>
        <View style={styles.avatar}>
          <IconUser size={16} color={colors.offWhite} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* ─── Session Label ─── */}
      <Text style={styles.sessionLabel}>TODAY'S SESSION</Text>

      {/* ─── Hero Title (massive serif) ─── */}
      <Text style={styles.heroTitle}>{suggested.title}</Text>

      {/* ─── Workout Items ─── */}
      <View style={styles.workoutList}>
        {suggested.items.map((item, i) => (
          <View key={item} style={styles.workoutItem}>
            <Svg width={6} height={6} viewBox="0 0 6 6">
              <SvgRect
                x={1} y={1} width={4} height={4} rx={0.5}
                fill={i === 0 ? colors.neonYellow : colors.steel}
                rotation={45} origin="3, 3"
              />
            </Svg>
            <Text style={styles.workoutText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* ─── CTA Button ─── */}
      <TouchableOpacity style={styles.ctaButton} onPress={onStartSession} activeOpacity={0.85}>
        <Text style={styles.ctaText}>START SESSION</Text>
        <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ─── Week Activity (dots) ─── */}
      <View style={styles.weekSection}>
        <View style={styles.weekRow}>
          {weekActivity.map((count, i) => {
            const isToday = i === todayIndex;
            const hasActivity = count > 0;
            return (
              <View key={`d${i}`} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDot,
                    hasActivity && styles.weekDotActive,
                    isToday && !hasActivity && styles.weekDotToday,
                  ]}
                />
                <Text style={[styles.weekLabel, isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold }]}>
                  {weekDays[i]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ─── Bottom Stats ─── */}
      <View style={styles.statsRow}>
        {lastSession ? (
          <>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>LAST SESSION</Text>
              <Text style={styles.statValue}>{formatTime(lastSession.totalDurationMs)}</Text>
            </View>
            {lastRun && (
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>BEST PACE</Text>
                <Text style={[styles.statValue, { color: colors.neonYellow }]}>
                  {formatPace(lastRun.avgPaceSecPerKm)}
                </Text>
              </View>
            )}
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>{streak > 0 ? `${streak}D` : "—"}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>SESSIONS</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>READY</Text>
              <Text style={[styles.statValue, { color: colors.neonYellow }]}>GO</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>—</Text>
            </View>
          </>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  timeLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 4, textTransform: "uppercase" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },

  divider: { height: 1, backgroundColor: colors.graphite, marginBottom: spacing.xl },

  sessionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4, textTransform: "uppercase", marginBottom: spacing.sm },

  heroTitle: { fontFamily: fonts.headline, fontSize: 52, color: colors.offWhite, textTransform: "uppercase", lineHeight: 52, marginBottom: spacing.lg },

  workoutList: { gap: spacing.xs, marginBottom: spacing.xxl },
  workoutItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  workoutText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.silver, letterSpacing: 1 },

  ctaButton: { backgroundColor: colors.neonYellow, paddingVertical: 18, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.xl },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 4 },

  weekSection: { marginBottom: spacing.lg },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 6 },
  weekDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.graphite },
  weekDotActive: { backgroundColor: colors.neonYellow },
  weekDotToday: { borderWidth: 2, borderColor: colors.offWhite },
  weekLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },

  statsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.graphite, paddingTop: spacing.md },
  statBlock: { gap: 4 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, textTransform: "uppercase" },
  statValue: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", color: colors.offWhite },
});
