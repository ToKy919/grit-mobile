/**
 * GRIT — VIDEO STUDIO SCREEN (React Native)
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../design/tokens";
import { IconPace, IconHeart, IconStar, IconTimer, IconFire, IconShare } from "../components/Icons";
import Svg, { Polygon } from "react-native-svg";

const overlays = [
  { Icon: IconPace, label: "PACE", key: "pace" },
  { Icon: IconHeart, label: "BPM", key: "bpm" },
  { Icon: IconStar, label: "PR BADGE", key: "pr" },
  { Icon: IconTimer, label: "TIMER", key: "timer" },
  { Icon: IconFire, label: "CALORIES", key: "cal" },
];

const templates = [
  { name: "HIGHLIGHT", desc: "30s reel" },
  { name: "RACE DAY", desc: "Full recap" },
  { name: "PR MOMENT", desc: "Single feat" },
  { name: "STORY", desc: "15s vertical" },
];

export const VideoStudioScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeOverlays, setActiveOverlays] = useState<Record<string, boolean>>({ pace: true, bpm: true, timer: true });
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const toggleOverlay = (key: string) => {
    setActiveOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.label}>CREATE</Text>
      <Text style={styles.heroTitle}>STUDIO</Text>

      {/* Video Preview */}
      <View style={styles.videoPreview}>
        {/* Play button */}
        <View style={styles.playCenter}>
          <Svg width={48} height={48} viewBox="0 0 48 48">
            <Polygon points="18,12 36,24 18,36" fill="rgba(245,245,243,0.1)" stroke="rgba(245,245,243,0.15)" strokeWidth={1.5} />
          </Svg>
        </View>

        {/* Overlay: Pace */}
        {activeOverlays.pace && (
          <View style={[styles.overlay, { top: 16, left: 16 }]}>
            <Text style={styles.overlayValue}>4:32</Text>
            <Text style={styles.overlayUnit}>/KM</Text>
          </View>
        )}

        {/* Overlay: BPM */}
        {activeOverlays.bpm && (
          <View style={[styles.overlay, styles.overlayRed, { top: 16, right: 16 }]}>
            <Text style={[styles.overlayValue, { color: colors.danger }]}>167</Text>
            <Text style={styles.overlayUnit}>BPM</Text>
          </View>
        )}

        {/* Overlay: Timer */}
        {activeOverlays.timer && (
          <View style={[styles.overlay, { bottom: 16, alignSelf: "center", left: "35%" }]}>
            <Text style={[styles.overlayValue, { color: colors.offWhite, fontSize: 16 }]}>12:44</Text>
          </View>
        )}

        {/* GRIT watermark */}
        <Text style={styles.watermark}>GRIT</Text>
      </View>

      {/* Overlay Controls */}
      <Text style={styles.sectionLabel}>OVERLAYS</Text>
      <View style={styles.overlayRow}>
        {overlays.map((o) => {
          const isActive = activeOverlays[o.key];
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.overlayChip, isActive && styles.overlayChipActive]}
              onPress={() => toggleOverlay(o.key)}
              activeOpacity={0.7}
            >
              <o.Icon size={12} color={isActive ? colors.neonYellow : colors.ash} />
              <Text style={[styles.overlayChipText, isActive && { color: colors.neonYellow }]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Template Selection */}
      <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>TEMPLATE</Text>
      <View style={styles.templateRow}>
        {templates.map((t, i) => (
          <TouchableOpacity
            key={t.name}
            style={[styles.templateCard, i === selectedTemplate && styles.templateCardActive]}
            onPress={() => setSelectedTemplate(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.templateName, i === selectedTemplate && { color: colors.neonYellow }]}>{t.name}</Text>
            <Text style={styles.templateDesc}>{t.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export */}
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85}>
          <Text style={styles.exportText}>EXPORT HD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
          <IconShare size={18} color={colors.silver} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: spacing.lg },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.neonYellow, letterSpacing: 3, marginBottom: spacing.xs },
  heroTitle: { fontFamily: fonts.headline, fontSize: 38, color: colors.offWhite, textTransform: "uppercase", marginBottom: spacing.md },
  videoPreview: { height: 220, borderRadius: 14, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, overflow: "hidden", marginBottom: spacing.lg, justifyContent: "center", alignItems: "center" },
  playCenter: { position: "absolute" },
  overlay: { position: "absolute", backgroundColor: "rgba(10,10,10,0.75)", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: "rgba(239,255,0,0.2)", flexDirection: "row", alignItems: "baseline", gap: 4 },
  overlayRed: { borderColor: "rgba(239,68,68,0.2)" },
  overlayValue: { fontFamily: fonts.mono, fontSize: 18, fontWeight: "700", color: colors.neonYellow },
  overlayUnit: { fontFamily: fonts.body, fontSize: 8, color: colors.ash, letterSpacing: 2 },
  watermark: { position: "absolute", bottom: 16, right: 16, fontFamily: fonts.headlineBold, fontSize: 10, color: "rgba(239,255,0,0.5)", letterSpacing: 3 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, color: colors.ash, letterSpacing: 4, marginBottom: spacing.sm },
  overlayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  overlayChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite },
  overlayChipActive: { backgroundColor: colors.neonYellowDim, borderColor: colors.neonYellow },
  overlayChipText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ash, letterSpacing: 1 },
  templateRow: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  templateCard: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: 10, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", gap: 4 },
  templateCardActive: { backgroundColor: colors.carbon, borderColor: colors.neonYellow },
  templateName: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.silver, letterSpacing: 1 },
  templateDesc: { fontFamily: fonts.body, fontSize: 9, color: colors.ash },
  exportRow: { flexDirection: "row", gap: spacing.sm },
  exportBtn: { flex: 1, backgroundColor: colors.neonYellow, paddingVertical: 16, borderRadius: 10, alignItems: "center" },
  exportText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.black, letterSpacing: 4 },
  shareBtn: { width: 50, borderRadius: 10, backgroundColor: colors.carbon, borderWidth: 1, borderColor: colors.graphite, alignItems: "center", justifyContent: "center" },
});
