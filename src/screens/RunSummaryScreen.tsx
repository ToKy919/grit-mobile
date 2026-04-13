/**
 * GRIT — RUN SUMMARY SCREEN (Strava-level)
 *
 * Full post-run analysis:
 * - Carte plein écran avec tracé + PR badges
 * - Stats grid: Distance, Allure moy, Durée, D+, Alt max, Vitesse moy
 * - Analyse d'allure: graphique barres par km avec ligne moyenne
 * - Splits détaillés: Km / Allure / Barre proportionnelle / Élév par km
 * - PR notifications
 * - Performance intelligence
 */

import React, { useEffect, useRef, useMemo } from "react";
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
import Svg, { Rect, Line, Path, Text as SvgText } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import { RunMap } from "../components/RunMap";
import {
  IconPace, IconElevation, IconTimer, IconArrowRight,
  IconShare, IconStats, IconStar, IconFire, IconLocation,
} from "../components/Icons";
import {
  formatTime, formatPace, formatDistance, formatDistanceUnit,
  formatElevation, formatSpeed,
} from "../utils/formatters";
import type { RunSession } from "../types/workout";
import type { Split } from "../types/gps";
import { useWorkoutHistoryStore } from "../stores/useWorkoutHistoryStore";

const { width: SW } = Dimensions.get("window");
const CHART_W = SW - spacing.lg * 2;
const CHART_H = 160;

// ─── Animated Section ─────────────────────────────
const FadeIn: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
};

// ─── PR Banner ────────────────────────────────────
const PrBanner: React.FC<{ records: string[] }> = ({ records }) => {
  if (records.length === 0) return null;
  return (
    <FadeIn delay={200}>
      <View style={styles.prBanner}>
        <View style={styles.prIconBox}>
          <IconStar size={20} color={colors.neonYellow} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.prTitle}>RECORD PERSONNEL</Text>
          {records.map((r) => (
            <Text key={r} style={styles.prText}>{r}</Text>
          ))}
        </View>
      </View>
    </FadeIn>
  );
};

// ─── Pace Analysis Chart (like Strava) ────────────
const PaceChart: React.FC<{ splits: Split[]; avgPace: number }> = ({ splits, avgPace }) => {
  if (splits.length === 0) return null;

  const paces = splits.map((s) => s.paceSecPerKm);
  const minPace = Math.min(...paces) - 15;
  const maxPace = Math.max(...paces) + 15;
  const range = maxPace - minPace || 1;

  const barWidth = Math.min(40, (CHART_W - 40) / splits.length - 4);
  const chartLeft = 40;
  const chartWidth = CHART_W - chartLeft;

  // Y axis labels (pace values)
  const yLabels = [];
  const step = Math.ceil(range / 4 / 15) * 15;
  for (let p = Math.floor(minPace / step) * step; p <= maxPace; p += step) {
    if (p > 0) yLabels.push(p);
  }

  // Average pace line Y position
  const avgY = CHART_H - 20 - ((avgPace - minPace) / range) * (CHART_H - 40);

  return (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle}>ANALYSE D'ALLURE</Text>
      <View style={{ height: CHART_H + 20 }}>
        <Svg width={CHART_W} height={CHART_H + 20}>
          {/* Y axis labels */}
          {yLabels.map((p) => {
            const y = CHART_H - 20 - ((p - minPace) / range) * (CHART_H - 40);
            const m = Math.floor(p / 60);
            const s = Math.round(p % 60);
            return (
              <React.Fragment key={`y-${p}`}>
                <SvgText x={2} y={y + 4} fill={colors.ash} fontSize={9} fontFamily="monospace">
                  {m}:{String(s).padStart(2, "0")}
                </SvgText>
                <Line x1={chartLeft} y1={y} x2={CHART_W} y2={y} stroke={colors.graphite} strokeWidth={0.5} opacity={0.4} />
              </React.Fragment>
            );
          })}

          {/* Average pace dashed line */}
          <Line
            x1={chartLeft} y1={avgY} x2={CHART_W} y2={avgY}
            stroke={colors.offWhite}
            strokeWidth={1}
            strokeDasharray="6,4"
            opacity={0.5}
          />

          {/* Bars */}
          {splits.map((split, i) => {
            const pace = split.paceSecPerKm;
            const barH = ((pace - minPace) / range) * (CHART_H - 40);
            const x = chartLeft + (i * (chartWidth / splits.length)) + (chartWidth / splits.length - barWidth) / 2;
            const y = CHART_H - 20 - barH;

            // Color: faster than avg = neon yellow, slower = steel/blue
            const isFaster = pace < avgPace - 5;
            const isSlower = pace > avgPace + 5;
            const barColor = isFaster ? colors.neonYellow : isSlower ? "#3B82F6" : colors.steel;

            return (
              <Rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={barColor}
                opacity={0.85}
              />
            );
          })}
        </Svg>
      </View>
      <Text style={styles.chartUnit}>/km</Text>
    </View>
  );
};

// ─── Splits Table (like Strava) ───────────────────
const SplitsTable: React.FC<{ splits: Split[]; avgPace: number }> = ({ splits, avgPace }) => {
  if (splits.length === 0) return null;

  const fastestPace = Math.min(...splits.map((s) => s.paceSecPerKm));

  return (
    <View style={styles.splitsSection}>
      <Text style={styles.sectionTitle}>TEMPS INTERMÉDIAIRES</Text>

      {/* Header */}
      <View style={styles.splitsHeader}>
        <Text style={[styles.splitsHeaderText, { width: 32 }]}>Km</Text>
        <Text style={[styles.splitsHeaderText, { width: 48 }]}>Allure</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.splitsHeaderText, { width: 44, textAlign: "right" }]}>Élév.</Text>
      </View>

      <View style={styles.splitsHeaderLine} />

      {/* Rows */}
      {splits.map((split, i) => {
        const isFaster = split.paceSecPerKm < avgPace - 5;
        const isSlower = split.paceSecPerKm > avgPace + 5;
        const barPercent = (fastestPace / split.paceSecPerKm) * 100;
        const barColor = isFaster ? colors.neonYellow : isSlower ? "#3B82F6" : colors.steel;

        // Elevation per split
        const elevChange = split.elevationChangeM || 0;

        return (
          <FadeIn key={`split-${split.kmIndex}`} delay={800 + i * 60}>
            <View style={styles.splitRow}>
              <Text style={styles.splitKm}>{split.kmIndex}</Text>
              <Text style={[styles.splitPace, isFaster && { color: colors.neonYellow }]}>
                {formatPace(split.paceSecPerKm)}
              </Text>
              <View style={styles.splitBarContainer}>
                <View
                  style={[styles.splitBar, { width: `${barPercent}%`, backgroundColor: barColor }]}
                />
              </View>
              <Text style={styles.splitElev}>
                {elevChange >= 0 ? `${Math.round(elevChange)}` : `${Math.round(elevChange)}`}
              </Text>
            </View>
          </FadeIn>
        );
      })}
    </View>
  );
};

// ─── Performance Intelligence ─────────────────────
const PerformanceInsight: React.FC<{ session: RunSession }> = ({ session }) => {
  const distKm = (session.totalDistanceM / 1000).toFixed(1);
  const avgPaceStr = formatPace(session.avgPaceSecPerKm);
  const duration = formatTime(session.totalDurationMs, true);

  // Build insight message
  let message = "";
  const splits = session.splits;

  if (splits.length >= 3) {
    const firstHalf = splits.slice(0, Math.floor(splits.length / 2));
    const secondHalf = splits.slice(Math.floor(splits.length / 2));
    const avgFirst = firstHalf.reduce((s, sp) => s + sp.paceSecPerKm, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, sp) => s + sp.paceSecPerKm, 0) / secondHalf.length;

    if (avgSecond < avgFirst - 10) {
      message = `Negative split. Tu as accéléré en seconde moitié avec une allure moyenne de ${formatPace(avgSecond)}/km contre ${formatPace(avgFirst)}/km en première moitié. Excellente gestion de course.`;
    } else if (avgSecond > avgFirst + 15) {
      message = `Positive split. Tu as ralenti en seconde moitié (${formatPace(avgSecond)}/km vs ${formatPace(avgFirst)}/km). Essaie de partir moins vite pour maintenir l'allure.`;
    } else {
      message = `Allure régulière sur ${distKm}km avec une moyenne de ${avgPaceStr}/km. Bonne maîtrise du rythme.`;
    }
  } else {
    message = `Course de ${distKm}km en ${duration} à ${avgPaceStr}/km.`;
  }

  if (session.elevationGainM > 50) {
    message += ` Dénivelé positif de ${Math.round(session.elevationGainM)}m.`;
  }

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <IconFire size={16} color={colors.neonYellow} />
        <Text style={styles.insightTitle}>GRIT INTELLIGENCE</Text>
      </View>
      <Text style={styles.insightText}>{message}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────
interface RunSummaryScreenProps {
  session: RunSession;
  onDismiss: () => void;
}

export const RunSummaryScreen: React.FC<RunSummaryScreenProps> = ({
  session,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const personalRecords = useWorkoutHistoryStore((s) => s.personalRecords);

  // Computed stats
  const avgSpeed = session.totalDistanceM / (session.totalDurationMs / 1000);
  const maxAltitude = Math.max(
    ...session.trackPoints.filter((p) => p.altitude !== null).map((p) => p.altitude as number),
    0
  );

  // Check for PRs achieved in this session
  const sessionPRs = personalRecords
    .filter((pr) => pr.sessionId === session.id)
    .map((pr) => `Meilleur temps sur ${pr.category} !`);

  // Elevation profile data
  const elevations = session.trackPoints
    .filter((p) => p.altitude !== null)
    .map((p) => p.altitude as number);

  const elevMin = elevations.length > 0 ? Math.min(...elevations) : 0;
  const elevMax = elevations.length > 0 ? Math.max(...elevations) : 0;
  const elevRange = elevMax - elevMin || 1;

  // Build elevation SVG path
  let elevPath = "";
  if (elevations.length > 4) {
    const step = (CHART_W) / (elevations.length - 1);
    elevPath = `M 0 60`;
    for (let i = 0; i < elevations.length; i++) {
      const x = i * step;
      const y = 60 - ((elevations[i] - elevMin) / elevRange) * 52;
      elevPath += ` L ${x} ${y}`;
    }
    elevPath += ` L ${CHART_W} 60 Z`;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ─── Map (plein écran comme Strava) ─── */}
        <FadeIn delay={0}>
          <RunMap
            trackPoints={session.trackPoints}
            splits={session.splits}
            isLive={false}
            height={350}
          />
        </FadeIn>

        <View style={styles.content}>

          {/* ─── Header: Date + Location ─── */}
          <FadeIn delay={100}>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <IconLocation size={14} color={colors.ash} />
                <Text style={styles.dateText}>
                  {new Date(session.startedAt).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {session.notes ? ` · ${session.notes}` : ""}
                </Text>
              </View>
              <Text style={styles.activityType}>COURSE À PIED</Text>
            </View>
          </FadeIn>

          {/* ─── PR Banner ─── */}
          <PrBanner records={sessionPRs} />

          {/* ─── Stats Grid (2x3 like Strava) ─── */}
          <FadeIn delay={300}>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {(session.totalDistanceM / 1000).toFixed(2)}{" "}
                  <Text style={styles.statUnit}>km</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Allure moyenne</Text>
                <Text style={styles.statValue}>
                  {formatPace(session.avgPaceSecPerKm)}{" "}
                  <Text style={styles.statUnit}>/km</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Durée</Text>
                <Text style={styles.statValue}>
                  {formatTime(session.totalDurationMs, true)}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Dénivelé positif</Text>
                <Text style={styles.statValue}>
                  {Math.round(session.elevationGainM)}{" "}
                  <Text style={styles.statUnit}>m</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Altitude max</Text>
                <Text style={styles.statValue}>
                  {Math.round(maxAltitude)}{" "}
                  <Text style={styles.statUnit}>m</Text>
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statLabel}>Vitesse moy</Text>
                <Text style={styles.statValue}>
                  {formatSpeed(avgSpeed)}{" "}
                  <Text style={styles.statUnit}>km/h</Text>
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* ─── Performance Intelligence ─── */}
          <FadeIn delay={500}>
            <PerformanceInsight session={session} />
          </FadeIn>

          {/* ─── Pace Analysis Chart ─── */}
          <FadeIn delay={600}>
            <PaceChart splits={session.splits} avgPace={session.avgPaceSecPerKm} />
          </FadeIn>

          {/* ─── Splits Table ─── */}
          <FadeIn delay={700}>
            <SplitsTable splits={session.splits} avgPace={session.avgPaceSecPerKm} />
          </FadeIn>

          {/* ─── Elevation Profile ─── */}
          {elevPath !== "" && (
            <FadeIn delay={900}>
              <View style={styles.elevSection}>
                <Text style={styles.sectionTitle}>PROFIL D'ALTITUDE</Text>
                <View style={styles.elevContainer}>
                  <Svg width={CHART_W} height={60}>
                    <Path d={elevPath} fill={colors.neonYellowDim} stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.6} />
                  </Svg>
                  <View style={styles.elevLabels}>
                    <Text style={styles.elevLabel}>{Math.round(elevMin)}m</Text>
                    <Text style={styles.elevLabel}>{Math.round(elevMax)}m</Text>
                  </View>
                </View>
              </View>
            </FadeIn>
          )}

          {/* ─── Actions ─── */}
          <FadeIn delay={1000}>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
                <IconShare size={18} color={colors.silver} />
                <Text style={styles.shareBtnText}>PARTAGER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={onDismiss} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>TERMINÉ</Text>
                <IconArrowRight size={14} color={colors.black} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </FadeIn>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: spacing.lg },

  // Header
  header: { marginTop: spacing.lg, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontFamily: fonts.body, fontSize: 13, color: colors.ash },
  activityType: { fontFamily: fonts.headline, fontSize: 28, color: colors.offWhite, marginTop: 8, textTransform: "uppercase" },

  // PR Banner
  prBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(239,255,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,255,0,0.2)",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  prIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(239,255,0,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  prTitle: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 3, marginBottom: 4 },
  prText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.offWhite },

  // Stats Grid (2x3)
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  statCell: {
    width: "50%",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.graphite,
  },
  statLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, marginBottom: 4 },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.offWhite },
  statUnit: { fontFamily: fonts.body, fontSize: 14, color: colors.ash },

  // Insight Card
  insightCard: {
    backgroundColor: colors.carbon,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.graphite,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  insightTitle: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.neonYellow, letterSpacing: 3 },
  insightText: { fontFamily: fonts.body, fontSize: 14, color: colors.silver, lineHeight: 22 },

  // Pace Chart
  chartSection: { marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.offWhite, marginBottom: spacing.md },
  chartUnit: { fontFamily: fonts.body, fontSize: 10, color: colors.ash, textAlign: "left", marginTop: -4 },

  // Splits Table
  splitsSection: { marginBottom: spacing.lg },
  splitsHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  splitsHeaderText: { fontFamily: fonts.body, fontSize: 12, color: colors.ash },
  splitsHeaderLine: { height: 1, backgroundColor: colors.graphite, marginBottom: 4 },
  splitRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  splitKm: { fontFamily: fonts.body, fontSize: 14, color: colors.ash, width: 32 },
  splitPace: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.offWhite, width: 48 },
  splitBarContainer: { flex: 1, height: 8, backgroundColor: "transparent", borderRadius: 4 },
  splitBar: { height: "100%", borderRadius: 4 },
  splitElev: { fontFamily: fonts.body, fontSize: 13, color: colors.ash, width: 44, textAlign: "right" },

  // Elevation
  elevSection: { marginBottom: spacing.lg },
  elevContainer: {},
  elevLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  elevLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash },

  // Actions
  actions: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 10, borderWidth: 1, borderColor: colors.graphite, backgroundColor: colors.carbon,
  },
  shareBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.silver, letterSpacing: 3 },
  doneBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.neonYellow, paddingVertical: 16, borderRadius: 10,
  },
  doneBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.black, letterSpacing: 4 },
});
