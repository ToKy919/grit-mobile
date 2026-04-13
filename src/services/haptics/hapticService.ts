/**
 * GRIT — Haptic Feedback Service
 */

import * as Haptics from "expo-haptics";

export const hapticService = {
  /** Heavy impact — round/station complete */
  roundComplete: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Light impact — rep count, phase change */
  light: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium impact — button press */
  medium: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Countdown tick (3, 2, 1) */
  countdown: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),

  /** Workout finished — success */
  workoutFinished: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Warning — time cap reached */
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Error — data loss, GPS lost */
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
