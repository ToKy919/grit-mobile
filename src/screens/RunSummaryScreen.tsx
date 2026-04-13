/**
 * GRIT — RUN SUMMARY SCREEN
 *
 * Post-run summary with animated stats reveal.
 * Like Strava/Adidas Run — shows route on map + key metrics.
 * Cinematic feel with staggered number animations.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { RunMap } from "../components/RunMap";
import { IconPace, IconElevation, IconTimer, IconArrowRight, IconShare, IconStats } from "../components/Icons";
import { formatTime, formatPace, formatDistance, formatDistanceUnit, formatElevation, formatSpeed, formatDuration } from "../utils/formatters";
import type { RunSession } from "../types/workout";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface RunSummaryScreenProps {
  session: RunSession;
  onDismiss: () => void;
}

// ─── Animated Counter ─────────────────────────────
const AnimatedCounter: React.FC<{
  value: string;
  delay: number;
  style?: any;
}> = ({ value, delay, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.Text style={[style, { opacity, transform: [{ translateY }] }]}>
      {value}
    </Animated.Text>
  );
};

// ─── Animated Section ─────────────────────────────
const AnimatedSection: React.FC<{
  children: React.ReactNode;
  delay: number;
}> = ({ children, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Elevation Mini Graph ─────────────────────────
const ElevationGraph: React.FC<{ trackPoints: RunSession["trackPoints"] }> = ({ trackPoints }) => {
  if (trackPoints.length < 5) return null;

  const altitudes = trackPoints
    .filter((p) => p.altitude !== null)
    .map((p) => p.altitude as number);

  if (altitudes.length < 5) return null;

  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const range = maxAlt - minAlt || 1;

  const w = SCREEN_WIDTH - spacing.lg * 2;
  const h = 60;
  const step = w / (altitudes.length - 1);

  // Build SVG path
  let path = `M 0 ${h}`;
  for (let i = 0; i < altitudes.length; i++) {
    const x = i * step;
    const y = h - ((altitudes[i] - minAlt) / range) * (h - 4);
    path += ` L ${x} ${y}`;
  }
  path += ` L ${w} ${h} Z`;

  return (
    <View style={styles.elevGraph}>
      <Svg width={w} height={h}>
        <Path d={path} fill={colors.neonYellowDim} stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.6} />
      </Svg>
      <View style={styles.elevLabels}>
        <Text style={styles.elevLabel}>{Math.round(minAlt)}m</Text>
        <Text style={styles.elevLabel}>{Math.round(maxAlt)}m</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────
export const RunSummaryScreen: React.FC<RunSummaryScreenProps> = ({
  session,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate additional stats
  const avgSpeed = session.totalDistanceM / (session.totalDurationMs / 1000); // m/s

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header */}
        <AnimatedSection delay={0}>
          <View style={styles.header}>
            <Text style={styles.completeLabel}>RUN COMPLETE</Text>
            <Text style={styles.dateLabel}>
              {new Date(session.startedAt).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).toUpperCase()}
            </Text>
            {session.notes && (
              <Text style={styles.locationLabel}>{session.notes}</Text>
            )}
          </View>
        </AnimatedSection>

        {/* Hero Distance */}
        <AnimatedSection delay={300}>
          <View style={styles.heroBlock}>
            <AnimatedCounter
              value={formatDistance(session.totalDistanceM)}
              delay={400}
              style={styles.heroValue}
            />
            <AnimatedCounter
              value={formatDistanceUnit(session.totalDistanceM)}
              delay={500}
              style={styles.heroUnit}
            />
          </View>
        </AnimatedSection>

        {/* Map */}
        <AnimatedSection delay={600}>
          <View style={styles.mapBlock}>
            <RunMap
              trackPoints={session.trackPoints}
              splits={session.splits}
              isLive={false}
              height={250}
            />
          </View>
        </AnimatedSection>

        {/* Key Metrics Grid */}
        <AnimatedSection delay={900}>
          <View style={styles.metricsGrid}>
            {/* Duration */}
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <IconTimer size={16} color={colors.silver} />
              </View>
              <Text style={styles.metricLabel}>DURATION</Text>
              <AnimatedCounter
                value={formatTime(session.totalDurationMs, true)}
                delay={1000}
                style={styles.metricValue}
              />
            </View>

            {/* Avg Pace */}
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <IconPace size={16} color={colors.neonYellow} />
              </View>
              <Text style={styles.metricLabel}>AVG PACE</Text>
              <AnimatedCounter
                value={formatPace(session.avgPaceSecPerKm)}
                delay={1100}
                style={[styles.metricValue, { color: colors.neonYellow }]}
              />
              <Text style={styles.metricUnit}>/km</Text>
            </View>

            {/* Avg Speed */}
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <IconStats size={16} color={colors.silver} />
              </View>
              <Text style={styles.metricLabel}>AVG SPEED</Text>
              <AnimatedCounter
                value={formatSpeed(avgSpeed)}
                delay={1200}
                style={styles.metricValue}
              />
              <Text style={styles.metricUnit}>km/h</Text>
            </View>

            {/* Elevation */}
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <IconElevation size={16} color={colors.neonYellow} />
              </View>
              <Text style={styles.metricLabel}>ELEVATION</Text>
              <AnimatedCounter
                value={formatElevation(session.elevationGainM)}
                delay={1300}
                style={styles.metricValue}
              />
              <Text style={styles.metricUnit}>meters</Text>
            </View>
          </View>
        </AnimatedSection>

        {/* Elevation Profile */}
        <AnimatedSection delay={1400}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ELEVATION PROFILE</Text>
            <ElevationGraph trackPoints={session.trackPoints} />
          </View>
        </AnimatedSection>

        {/* Split Times */}
        {session.splits.length > 0 && (
          <AnimatedSection delay={1600}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SPLITS</Text>
              {session.splits.map((split, i) => {
                const prevPace = i > 0 ? session.splits[i - 1].paceSecPerKm : null;
                const diff = prevPace ? split.paceSecPerKm - prevPace : 0;
                const isFaster = diff < -2;
                const isSlower = diff > 2;

                return (
                  <AnimatedSection key={`split-${split.kmIndex}`} delay={1700 + i * 80}>
                    <View style={styles.splitRow}>
                      <Text style={styles.splitKm}>KM {split.kmIndex}</Text>
                      <View style={styles.splitPaceBar}>
                        <View
                          style={[
                            styles.splitBar,
                            {
                              width: `${Math.min(100, (session.avgPaceSecPerKm / split.paceSecPerKm) * 80)}%`,
                              backgroundColor: isFaster ? colors.neonYellow : isSlower ? colors.danger : colors.steel,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.splitPace,
                          isFaster && { color: colors.neonYellow },
                          isSlower && { color: colors.danger },
                        ]}
                      >
                        {formatPace(split.paceSecPerKm)}
                      </Text>
                    </View>
                  </AnimatedSection>
                );
              })}
            </View>
          </AnimatedSection>
        )}

        {/* Actions */}
        <AnimatedSection delay={2000}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
              <IconShare size={18} color={colors.silver} />
              <Text style={styles.shareBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>DONE</Text>
              <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md },
  completeLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.neonYellow, letterSpacing: 6, marginBottom: 8 },
  dateLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ash, letterSpacing: 3 },
  locationLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.silver, marginTop: 4 },

  heroBlock: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  heroValue: { fontFamily: fonts.mono, fontSize: 72, fontWeight: "700", color: colors.offWhite, letterSpacing: -3 },
  heroUnit: { fontFamily: fonts.bodyMedium, fontSize: 20, color: colors.ash, marginLeft: 8 },

  mapBlock: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  metricCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2 - 1,
    backgroundColor: colors.carbon,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.graphite,
    gap: 4,
  },
  metricIcon: { marginBottom: 4 },
  metricLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 3 },
  metricValue: { fontFamily: fonts.mono, fontSize: 28, fontWeight: "700", color: colors.offWhite },
  metricUnit: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.ash },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },

  elevGraph: { marginBottom: spacing.xs },
  elevLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  elevLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash },

  splitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 6 },
  splitKm: { fontFamily: fonts.mono, fontSize: 11, fontWeight: "700", color: colors.ash, width: 38 },
  splitPaceBar: { flex: 1, height: 6, backgroundColor: colors.graphite, borderRadius: 3, overflow: "hidden" },
  splitBar: { height: "100%", borderRadius: 3 },
  splitPace: { fontFamily: fonts.mono, fontSize: 13, fontWeight: "700", color: colors.offWhite, width: 44, textAlign: "right" },

  actions: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: colors.graphite, backgroundColor: colors.carbon },
  shareBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.silver, letterSpacing: 3 },
  doneBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.neonYellow, paddingVertical: 16, borderRadius: 10 },
  doneBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 4 },
});
