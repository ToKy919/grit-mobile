/**
 * GRIT — Display Formatters
 * All formatting for UI display — times, distances, paces
 */

/**
 * Format milliseconds as MM:SS or HH:MM:SS
 */
export function formatTime(ms: number, forceHours: boolean = false): string {
  if (ms < 0) ms = 0;

  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0 || forceHours) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format milliseconds as MM:SS.cc (centiseconds)
 */
export function formatTimePrecise(ms: number): string {
  if (ms < 0) ms = 0;

  const totalSec = Math.floor(ms / 1000);
  const centisec = Math.floor((ms % 1000) / 10);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centisec).padStart(2, "0")}`;
}

/**
 * Format pace (seconds per km) as M:SS /km
 */
export function formatPace(secPerKm: number): string {
  if (secPerKm <= 0 || !isFinite(secPerKm)) return "--:--";
  if (secPerKm > 3600) return "--:--"; // > 60min/km = standing still

  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format distance in meters to display value
 * < 1000m → "XXXm"
 * >= 1000m → "X.XX km"
 */
export function formatDistance(meters: number): string {
  if (meters < 0) meters = 0;

  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}`;
}

/**
 * Format distance unit label
 */
export function formatDistanceUnit(meters: number): string {
  return meters < 1000 ? "m" : "km";
}

/**
 * Format speed in m/s to km/h
 */
export function formatSpeed(metersPerSec: number): string {
  return `${(metersPerSec * 3.6).toFixed(1)}`;
}

/**
 * Format elevation in meters
 */
export function formatElevation(meters: number): string {
  return `+${Math.round(meters)}`;
}

/**
 * Format a date as relative ("2h ago", "yesterday", "3 days ago")
 */
export function formatRelativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format a duration in ms to human readable ("1h 12min", "45min", "3min 22s")
 */
export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;

  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) {
    const secs = Math.floor((ms % 60000) / 1000);
    return secs > 0 ? `${minutes}min ${secs}s` : `${minutes}min`;
  }
  return `${Math.floor(ms / 1000)}s`;
}
