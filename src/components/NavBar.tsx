/**
 * GRIT — Bottom Navigation Bar (React Native)
 */

import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../design/tokens";
import { IconHome, IconTrack, IconHyrox, IconStats, IconStudio } from "./Icons";

const tabs = [
  { Icon: IconHome, label: "HOME" },
  { Icon: IconTrack, label: "RUN" },
  { Icon: IconHyrox, label: "WOD" },
  { Icon: IconHyrox, label: "HYROX" },
  { Icon: IconStats, label: "STATS" },
  { Icon: IconStudio, label: "STUDIO" },
];

interface NavBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeIndex, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <TouchableOpacity
            key={tab.label + i}
            style={styles.tab}
            onPress={() => onTabPress(i)}
            activeOpacity={0.7}
          >
            <tab.Icon
              size={20}
              color={isActive ? colors.neonYellow : colors.ash}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.neonYellow : colors.ash,
                  fontFamily: isActive ? fonts.bodyBold : fonts.bodyMedium,
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 10, 10, 0.97)",
    borderTopWidth: 1,
    borderTopColor: colors.graphite,
    paddingTop: 10,
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    gap: 4,
    minWidth: 50,
  },
  label: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neonYellow,
    marginTop: 2,
  },
});
