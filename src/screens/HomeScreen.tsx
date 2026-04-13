/**
 * GRIT — HOME SCREEN (React Native)
 * "Daily War Room"
 */

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconUser, IconArrowRight } from "../components/Icons";
import Svg, { Rect } from "react-native-svg";

interface HomeScreenProps {
  onStartSession?: () => void;
}

const workoutItems = [
  "8 x 1KM RUN",
  "SLED PUSH \u00B7 4 SETS",
  "BURPEE BROAD JUMP",
  "WALL BALLS \u00B7 75 REPS",
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartSession }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.timeLabel}>06:12 AM</Text>
        <View style={styles.avatar}>
          <IconUser size={16} color={colors.offWhite} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.sessionLabel}>TODAY'S SESSION</Text>

        <Text style={styles.heroTitle}>HYROX</Text>
        <Text style={styles.heroTitle}>SIMULATION</Text>

        {/* Workout Items */}
        <View style={styles.workoutList}>
          {workoutItems.map((item, i) => (
            <View key={item} style={styles.workoutItem}>
              <Svg width={6} height={6} viewBox="0 0 6 6">
                <Rect
                  x={1} y={1} width={4} height={4} rx={0.5}
                  fill={i === 0 ? colors.neonYellow : colors.steel}
                  rotation={45}
                  origin="3, 3"
                />
              </Svg>
              <Text style={styles.workoutText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={onStartSession}
        >
          <Text style={styles.ctaText}>START SESSION</Text>
          <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Bottom Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "LAST SESSION", value: "01:12:44" },
          { label: "PR TREND", value: "+2%", accent: true },
          { label: "STREAK", value: "12D" },
        ].map((stat) => (
          <View key={stat.label} style={styles.statBlock}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, stat.accent && { color: colors.neonYellow }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  timeLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ash, letterSpacing: 4, textTransform: "uppercase" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.steel, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: colors.graphite, marginBottom: spacing.xl },
  content: { flex: 1, justifyContent: "center" },
  sessionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 4, textTransform: "uppercase", marginBottom: spacing.sm },
  heroTitle: { fontFamily: fonts.headline, fontSize: 52, color: colors.offWhite, textTransform: "uppercase", lineHeight: 52 },
  workoutList: { marginTop: spacing.lg, gap: spacing.xs },
  workoutItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  workoutText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.silver, letterSpacing: 1 },
  ctaButton: { backgroundColor: colors.neonYellow, paddingVertical: 18, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xxl },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 4 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.graphite, paddingTop: spacing.md, marginBottom: spacing.md },
  statBlock: { gap: 4 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, textTransform: "uppercase" },
  statValue: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", color: colors.offWhite },
});
