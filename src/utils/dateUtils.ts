/**
 * GRIT — Date Utilities
 */

import type { WorkoutSession } from "../types/workout";

/**
 * Check if two timestamps are the same calendar day
 */
export function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Calculate consecutive day streak from workout sessions
 */
export function getStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;

  const completed = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt - a.startedAt);

  if (completed.length === 0) return 0;

  // Check if there's a session today or yesterday (streak can't have gap)
  const now = Date.now();
  const mostRecent = completed[0].startedAt;
  const daysSinceLast = Math.floor((now - mostRecent) / 86400000);
  if (daysSinceLast > 1) return 0;

  let streak = 1;
  let currentDay = new Date(mostRecent);
  currentDay.setHours(0, 0, 0, 0);

  for (let i = 1; i < completed.length; i++) {
    const prevDay = new Date(currentDay);
    prevDay.setDate(prevDay.getDate() - 1);

    const sessionDay = new Date(completed[i].startedAt);
    sessionDay.setHours(0, 0, 0, 0);

    if (sessionDay.getTime() === prevDay.getTime()) {
      streak++;
      currentDay = prevDay;
    } else if (sessionDay.getTime() === currentDay.getTime()) {
      // Same day as previous counted session, skip
      continue;
    } else {
      break; // Gap found
    }
  }

  return streak;
}

/**
 * Get workout counts per day for the current week (Mon-Sun)
 * Returns array of 7 numbers
 */
export function getWeekActivity(sessions: WorkoutSession[]): number[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const result = [0, 0, 0, 0, 0, 0, 0];

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    const sessionDate = new Date(session.startedAt);
    const diffDays = Math.floor(
      (sessionDate.getTime() - monday.getTime()) / 86400000
    );
    if (diffDays >= 0 && diffDays < 7) {
      result[diffDays]++;
    }
  }

  return result;
}

/**
 * Get consistency percentage (days with workouts / total days in period)
 */
export function getConsistency(
  sessions: WorkoutSession[],
  periodDays: number = 30
): number {
  const cutoff = Date.now() - periodDays * 86400000;
  const completedInPeriod = sessions.filter(
    (s) => s.status === "completed" && s.startedAt >= cutoff
  );

  const uniqueDays = new Set<string>();
  for (const s of completedInPeriod) {
    const d = new Date(s.startedAt);
    uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  return Math.round((uniqueDays.size / periodDays) * 100);
}

/**
 * Get total volume in milliseconds for completed sessions
 */
export function getTotalVolume(sessions: WorkoutSession[]): number {
  return sessions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.totalDurationMs, 0);
}
