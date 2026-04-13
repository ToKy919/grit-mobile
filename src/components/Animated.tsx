/**
 * GRIT — Animation Components
 *
 * Reusable animation primitives matching the Remotion design DNA:
 * - FadeSlideUp: opacity 0→1, translateY 20→0 (signature GRIT reveal)
 * - StaggerChildren: auto-delays children
 * - ScaleIn: press feedback
 * - RevealText: letter spacing animation
 */

import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, TextStyle } from "react-native";

// ─── FadeSlideUp ──────────────────────────────────
// The signature GRIT reveal. Every element uses this.

interface FadeSlideUpProps {
  delay?: number;
  duration?: number;
  distance?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FadeSlideUp: React.FC<FadeSlideUpProps> = ({
  delay = 0,
  duration = 500,
  distance = 20,
  children,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
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
  }, [delay, duration]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── FadeIn (simple opacity) ──────────────────────

interface FadeInProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  duration = 400,
  children,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, duration]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};


// ─── RevealLine (horizontal line wipe) ────────────

interface RevealLineProps {
  delay?: number;
  duration?: number;
  color?: string;
  height?: number;
}

export const RevealLine: React.FC<RevealLineProps> = ({
  delay = 0,
  duration = 600,
  color = "#2A2A2A",
  height = 1,
}) => {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(width, {
        toValue: 100,
        duration,
        useNativeDriver: false, // width animation can't use native driver
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, duration]);

  return (
    <Animated.View
      style={{
        height,
        backgroundColor: color,
        width: width.interpolate({
          inputRange: [0, 100],
          outputRange: ["0%", "100%"],
        }),
      }}
    />
  );
};

// ─── Stagger helper ───────────────────────────────
// Returns delay for nth element
export function stagger(index: number, interval: number = 60): number {
  return index * interval;
}
