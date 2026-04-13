/**
 * GRIT — HOME SCREEN "DAILY WAR ROOM"
 *
 * EXACT replica of Remotion design + real data + animations.
 * Editorial layout, massive serif headline, staggered reveals.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect as SvgRect } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import { IconUser, IconArrowRight } from "../components/Icons";
import { FadeSlideUp, RevealLine, stagger } from "../components/Animated";
import { BackgroundImage } from "../components/BackgroundImage";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";
import { getStreak } from "../utils/dateUtils";
import { formatTime, formatPace } from "../utils/formatters";
import type { RunSession } from "../types/workout";

interface HomeScreenProps {
  onStartSession?: () => void;
}

const SESSIONS_ROTATION = [
  { title: "HYROX\nSIMULATION", items: ["8 × 1KM RUN", "SLED PUSH · 4 SETS", "BURPEE BROAD JUMP", "WALL BALLS · 75 REPS"] },
  { title: "TEMPO\nRUN", items: ["5KM AT THRESHOLD", "AVG PACE TARGET", "NEGATIVE SPLIT", "COOL DOWN 1KM"] },
  { title: "AMRAP\n20 MIN", items: ["15 WALL BALLS", "10 BURPEES", "200M RUN", "REPEAT"] },
  { title: "INTERVAL\nSESSION", items: ["8 × 400M", "90S REST BETWEEN", "MAX EFFORT", "TRACK SPLITS"] },
  { title: "EMOM\n12 MIN", items: ["MIN 1: 15 KB SWINGS", "MIN 2: 12 BOX JUMPS", "MIN 3: 200M RUN", "REPEAT × 4"] },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const insets = useSafeAreaInsets();
  const sessions = useWorkoutHistoryStore((s) => s.sessions);

  const completed = sessions.filter((s) => s.status === "completed");
  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const lastSession = completed[0];
  const lastRun = completed.find((s) => s.type === "run") as RunSession | undefined;

  const suggested = SESSIONS_ROTATION[new Date().getDay() % SESSIONS_ROTATION.length];
  const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Real stats or defaults
  const lastValue = lastSession ? formatTime(lastSession.totalDurationMs) : "—";
  const paceValue = lastRun ? formatPace(lastRun.avgPaceSecPerKm) : "—";
  const streakValue = streak > 0 ? `${streak}D` : "—";

  return (
    <View style={styles.screen}>
      {/* Background image — ultra subtle editorial feel */}
      <BackgroundImage image="silhouette" opacity={0.07} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>

        {/* Header — Time + Avatar */}
        <FadeSlideUp delay={0}>
          <View style={styles.header}>
            <Text style={styles.timeLabel}>{timeStr}</Text>
            <View style={styles.avatar}>
              <IconUser size={16} color={colors.offWhite} />
            </View>
          </View>
        </FadeSlideUp>

        {/* Divider line (animated reveal) */}
        <FadeSlideUp delay={stagger(1)} style={{ marginBottom: spacing.xl }}>
          <RevealLine delay={150} duration={800} />
        </FadeSlideUp>

        {/* Main Editorial Block */}
        <View style={styles.mainBlock}>

          {/* Day label */}
          <FadeSlideUp delay={stagger(2)}>
            <Text style={styles.sessionLabel}>TODAY'S SESSION</Text>
          </FadeSlideUp>

          {/* Workout Title — MASSIVE SERIF */}
          <FadeSlideUp delay={stagger(3)} style={{ marginBottom: spacing.md }}>
            <Text style={styles.heroTitle}>{suggested.title}</Text>
          </FadeSlideUp>

          {/* Workout Details (staggered diamonds) */}
          <View style={styles.workoutList}>
            {suggested.items.map((line, i) => (
              <FadeSlideUp key={line} delay={stagger(4 + i, 50)}>
                <View style={styles.workoutItem}>
                  <Svg width={6} height={6} viewBox="0 0 6 6">
                    <SvgRect
                      x={1} y={1} width={4} height={4} rx={0.5}
                      fill={i === 0 ? colors.neonYellow : colors.steel}
                      rotation={45} origin="3, 3"
                    />
                  </Svg>
                  <Text style={styles.workoutText}>{line}</Text>
                </View>
              </FadeSlideUp>
            ))}
          </View>

          {/* CTA Button */}
          <FadeSlideUp delay={stagger(8)}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onStartSession}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>START SESSION</Text>
              <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </FadeSlideUp>
        </View>

        {/* Bottom Stats Row */}
        <FadeSlideUp delay={stagger(10)}>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>LAST SESSION</Text>
              <Text style={styles.statValue}>{lastValue}</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>AVG PACE</Text>
              <Text style={[styles.statValue, paceValue !== "—" && { color: colors.neonYellow }]}>
                {paceValue}
              </Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>{streakValue}</Text>
            </View>
          </View>
        </FadeSlideUp>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  timeLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.ash,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBlock: {
    flex: 1,
    justifyContent: "center",
  },
  sessionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.neonYellow,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: fonts.headline,
    fontSize: 52,
    color: colors.offWhite,
    textTransform: "uppercase",
    lineHeight: 50,
    letterSpacing: -2,
  },
  workoutList: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  workoutText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.silver,
    letterSpacing: 1,
  },
  ctaButton: {
    backgroundColor: colors.neonYellow,
    paddingVertical: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    // Simulated glow via shadow
    shadowColor: colors.neonYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.black,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.graphite,
    paddingTop: spacing.md,
    marginTop: spacing.lg,
  },
  statBlock: {
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.ash,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: "700",
    color: colors.offWhite,
    letterSpacing: -1,
  },
});
