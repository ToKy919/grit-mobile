/**
 * GRIT — PROGRESS SCREEN
 *
 * Exact Remotion design: "YOUR GRIT" headline, stats cards,
 * weekly bar chart, PRs list — all with staggered animations.
 * Real data from store. Never truly empty (shows identity).
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconPace, IconTimer, IconHyrox, IconStar } from "../components/Icons";
import { FadeSlideUp, RevealLine, stagger } from "../components/Animated";
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

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = (new Date().getDay() + 6) % 7;
  const maxWeek = Math.max(...weekActivity, 1);

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>

      {/* Header — matches Remotion exactly */}
      <FadeSlideUp delay={0}>
        <Text style={styles.label}>PERFORMANCE</Text>
      </FadeSlideUp>
      <FadeSlideUp delay={stagger(1)}>
        <Text style={styles.heroTitle}>YOUR{"\n"}GRIT</Text>
      </FadeSlideUp>

      {/* Stats Grid — 3 cards (matches Remotion layout) */}
      <FadeSlideUp delay={stagger(2)}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <Text style={styles.statValue}>{completed.length || "0"}</Text>
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
      </FadeSlideUp>

      {/* Weekly Chart — matches Remotion bar chart */}
      <FadeSlideUp delay={stagger(3)}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>THIS WEEK</Text>
            <Text style={styles.sectionAccent}>
              {weekActivity.filter((d) => d > 0).length} / 7 DAYS
            </Text>
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
                        height: Math.max(4, (val / maxWeek) * 70),
                        backgroundColor: val > 0
                          ? isToday ? colors.neonYellow : colors.graphite
                          : colors.graphite,
                      },
                      isToday && val > 0 && {
                        shadowColor: colors.neonYellow,
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday && { color: colors.neonYellow, fontFamily: fonts.bodyBold },
                    ]}
                  >
                    {weekDays[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </FadeSlideUp>

      {/* Personal Records — matches Remotion PR cards */}
      <FadeSlideUp delay={stagger(4)}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {personalRecords.length > 0 ? (
            personalRecords.map((pr, i) => (
              <FadeSlideUp key={pr.category} delay={stagger(5 + i, 50)}>
                <View style={styles.prRow}>
                  <Text style={styles.prCategory}>{pr.category}</Text>
                  <Text style={styles.prValue}>
                    {pr.unit === "time" ? formatTime(pr.value, true) : String(pr.value)}
                  </Text>
                </View>
              </FadeSlideUp>
            ))
          ) : (
            <View style={styles.prRow}>
              <Text style={styles.prCategory}>NO RECORDS YET</Text>
              <Text style={[styles.prValue, { color: colors.ash }]}>—</Text>
            </View>
          )}
        </View>
      </FadeSlideUp>

      {/* Recent Sessions */}
      {completed.length > 0 && (
        <FadeSlideUp delay={stagger(8)}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT</Text>
            {completed.slice(0, 6).map((session, i) => (
              <FadeSlideUp key={session.id} delay={stagger(9 + i, 40)}>
                <View style={styles.historyRow}>
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
                  <Text style={styles.historyDuration}>{formatTime(session.totalDurationMs)}</Text>
                </View>
              </FadeSlideUp>
            ))}
          </View>
        </FadeSlideUp>
      )}

      {/* Empty state — motivational (never truly empty) */}
      {completed.length === 0 && (
        <FadeSlideUp delay={stagger(6)}>
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>NO EXCUSES</Text>
            <RevealLine delay={800} color={colors.graphite} />
            <Text style={styles.emptyDesc}>
              Your first session will appear here.{"\n"}Every rep counts. Start now.
            </Text>
          </View>
        </FadeSlideUp>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },

  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4 },
  heroTitle: { fontFamily: fonts.headline, fontSize: 48, color: colors.offWhite, textTransform: "uppercase", lineHeight: 48, marginTop: spacing.xs, marginBottom: spacing.lg },

  // Stats Grid (Remotion exact)
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.carbon, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 6 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.ash, letterSpacing: 3 },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 28, color: colors.offWhite },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  sectionAccent: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow },

  // Week chart (Remotion exact)
  weekChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  bar: { width: "70%", borderRadius: 4, maxWidth: 36 },
  dayLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.ash },

  // PRs (Remotion exact card style)
  prRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, marginTop: 6 },
  prCategory: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.silver, letterSpacing: 1 },
  prValue: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.offWhite },

  // History
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.graphite },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,255,0,0.08)", alignItems: "center", justifyContent: "center" },
  historyType: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.offWhite, letterSpacing: 1 },
  historyDate: { fontFamily: fonts.body, fontSize: 11, color: colors.ash },
  historyDuration: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite },

  // Empty
  emptyBlock: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontFamily: fonts.headline, fontSize: 36, color: colors.graphite, textTransform: "uppercase" },
  emptyDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, textAlign: "center", lineHeight: 22 },
});
