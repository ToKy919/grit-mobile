/**
 * GRIT — Location Service
 * expo-location wrapper. Manages permissions, watch position, start/stop.
 * Plain TypeScript class — no React dependency.
 */

import * as Location from "expo-location";
import { getAdaptiveConfig } from "./adaptiveFrequency";

export type LocationCallback = (coords: {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}) => void;

export class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private currentSpeed: number = 0;
  private reconfigureTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Request foreground location permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  /**
   * Check current permission status
   */
  async getPermissionStatus(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  }

  /**
   * Start watching position. Calls onUpdate with each new location.
   */
  async start(onUpdate: LocationCallback): Promise<void> {
    // Clear any existing subscription
    this.stop();

    const config = getAdaptiveConfig(this.currentSpeed);

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: config.timeInterval,
        distanceInterval: config.distanceInterval,
      },
      (location) => {
        const { latitude, longitude, altitude, accuracy, speed } =
          location.coords;

        // Update current speed for adaptive frequency
        const newSpeed = speed ?? 0;
        if (this.shouldReconfigure(newSpeed)) {
          this.currentSpeed = newSpeed;
          this.reconfigure(onUpdate);
        } else {
          this.currentSpeed = newSpeed;
        }

        onUpdate({
          latitude,
          longitude,
          altitude: altitude ?? null,
          accuracy: accuracy ?? 999,
          speed: speed ?? null,
          timestamp: location.timestamp,
        });
      }
    );
  }

  /**
   * Stop watching position
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    if (this.reconfigureTimeout) {
      clearTimeout(this.reconfigureTimeout);
      this.reconfigureTimeout = null;
    }
  }

  /**
   * Check if we need to reconfigure based on speed threshold change
   */
  private shouldReconfigure(newSpeed: number): boolean {
    const oldConfig = getAdaptiveConfig(this.currentSpeed);
    const newConfig = getAdaptiveConfig(newSpeed);
    return oldConfig.timeInterval !== newConfig.timeInterval;
  }

  /**
   * Reconfigure location watching with new adaptive parameters.
   * Debounced to prevent rapid reconfiguration.
   */
  private reconfigure(onUpdate: LocationCallback): void {
    if (this.reconfigureTimeout) return;

    this.reconfigureTimeout = setTimeout(async () => {
      this.reconfigureTimeout = null;
      if (this.subscription) {
        this.stop();
        await this.start(onUpdate);
      }
    }, 5000); // Debounce 5s to avoid thrashing
  }
}
