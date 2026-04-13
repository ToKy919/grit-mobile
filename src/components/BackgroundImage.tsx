/**
 * GRIT — Background Image Component
 *
 * Ultra-subtle background image for editorial feel.
 * Grayscale, 5-8% opacity, with gradient overlay.
 * Matches the Remotion design language.
 */

import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../design/tokens";

// Image map — require() must be static in React Native
const IMAGES: Record<string, ImageSourcePropType> = {
  // These will work once you place the images in assets/images/
  // Uncomment the lines below after adding your photos:
  //
  // runner: require("../../assets/images/runner-road.jpg"),
  // silhouette: require("../../assets/images/runner-silhouette.jpg"),
  // crossfit: require("../../assets/images/gym-crossfit.jpg"),
  // boxing: require("../../assets/images/boxing-ring.jpg"),
  // bike: require("../../assets/images/athlete-bike.jpg"),
};

interface BackgroundImageProps {
  /** Image key from IMAGES map */
  image?: keyof typeof IMAGES;
  /** Opacity (default 0.06 — very subtle) */
  opacity?: number;
  /** Gradient direction (default top to bottom fade to black) */
  gradientStart?: number;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  image,
  opacity = 0.06,
  gradientStart = 0.3,
}) => {
  const source = image ? IMAGES[image] : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Image layer */}
      {source && (
        <Image
          source={source}
          style={[styles.image, { opacity }]}
          resizeMode="cover"
        />
      )}

      {/* Gradient overlay — fades to black */}
      <LinearGradient
        colors={[
          `rgba(10,10,10,${gradientStart})`,
          colors.black,
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />

      {/* Subtle neon glow at top corner */}
      <LinearGradient
        colors={[
          "rgba(239,255,0,0.04)",
          "transparent",
        ]}
        style={styles.glow}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    // Grayscale not natively supported in RN without GL filters
    // The opacity handles the subtle effect
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "60%",
    height: "40%",
  },
});
