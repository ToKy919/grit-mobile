/**
 * GRIT — Environment Banner Component
 *
 * Compact banner showing air quality + pollen status.
 * Appears at top of RunTracker when data is available.
 * Green = safe, Yellow = moderate, Red = unsafe.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, fonts, spacing } from "../design/tokens";
import type { AirQualityData } from "../services/google/airQualityService";
import type { PollenData } from "../services/google/pollenService";

interface EnvironmentBannerProps {
  airQuality: AirQualityData | null;
  pollen: PollenData | null;
  warning: string | null;
  expanded?: boolean;
  onToggle?: () => void;
}

export const EnvironmentBanner: React.FC<EnvironmentBannerProps> = ({
  airQuality,
  pollen,
  warning,
  expanded = false,
  onToggle,
}) => {
  if (!airQuality && !pollen) return null;

  return (
    <TouchableOpacity
      style={[styles.container, warning && styles.containerWarning]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Compact Row */}
      <View style={styles.row}>
        {/* Air Quality */}
        {airQuality && (
          <View style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: airQuality.color }]} />
            <Text style={styles.chipLabel}>AQI</Text>
            <Text style={[styles.chipValue, { color: airQuality.color }]}>
              {airQuality.aqi}
            </Text>
          </View>
        )}

        {/* Pollen */}
        {pollen && (
          <View style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: pollen.overallColor }]} />
            <Text style={styles.chipLabel}>POLLEN</Text>
            <Text style={[styles.chipValue, { color: pollen.overallColor }]}>
              {pollen.overallLevel.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Expand indicator */}
        <Text style={styles.expandIcon}>{expanded ? "▾" : "▸"}</Text>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.details}>
          {/* Air Quality Detail */}
          {airQuality && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>AIR</Text>
              <Text style={styles.detailText}>
                {airQuality.category} — {airQuality.dominantPollutant}
              </Text>
            </View>
          )}

          {/* Pollen Types */}
          {pollen && pollen.types.length > 0 && (
            <View style={styles.pollenTypes}>
              {pollen.types.map((type) => (
                <View key={type.code} style={styles.pollenType}>
                  <Text style={styles.detailLabel}>{type.name.toUpperCase()}</Text>
                  <View style={styles.pollenBar}>
                    <View
                      style={[
                        styles.pollenFill,
                        {
                          width: `${(type.index / 5) * 100}%`,
                          backgroundColor: type.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Warning */}
          {warning && (
            <Text style={styles.warningText}>{warning}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.carbon,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.graphite,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  containerWarning: {
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    color: colors.ash,
    letterSpacing: 2,
  },
  chipValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  expandIcon: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.ash,
    marginLeft: "auto",
  },
  details: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.graphite,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    color: colors.ash,
    letterSpacing: 2,
    width: 50,
  },
  detailText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.silver,
  },
  pollenTypes: {
    gap: 6,
  },
  pollenType: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pollenBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.graphite,
    borderRadius: 2,
    overflow: "hidden",
  },
  pollenFill: {
    height: "100%",
    borderRadius: 2,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.warning,
    lineHeight: 16,
    marginTop: 4,
  },
});
