/**
 * GRIT — Design Tokens (React Native)
 */

export const colors = {
  black: "#0A0A0A",
  carbon: "#1A1A1A",
  graphite: "#2A2A2A",
  steel: "#3A3A3A",
  ash: "#666666",
  silver: "#999999",
  offWhite: "#F5F5F3",
  white: "#FFFFFF",
  neonYellow: "#EFFF00",
  neonYellowDim: "rgba(239, 255, 0, 0.15)",
  neonYellowGlow: "rgba(239, 255, 0, 0.4)",
  success: "#22C55E",
  danger: "#EF4444",
  warning: "#F59E0B",
  overlay80: "rgba(10, 10, 10, 0.80)",
  overlay60: "rgba(10, 10, 10, 0.60)",
} as const;

export const fonts = {
  headline: "PlayfairDisplay_900Black",
  headlineBold: "PlayfairDisplay_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  mono: "monospace",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 96,
} as const;
