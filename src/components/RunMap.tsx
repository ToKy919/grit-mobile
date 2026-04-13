/**
 * GRIT — RunMap Component
 *
 * Real Google Maps with live route drawing.
 * Dark theme matching GRIT aesthetic.
 * Shows: route polyline, start marker, current position, km markers.
 * Falls back to SVG map if react-native-maps not available (Expo Go).
 */

import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, { Polyline, Circle, G, Text as SvgText, Line } from "react-native-svg";
import { colors, fonts, spacing } from "../design/tokens";
import type { TrackPoint, Split } from "../types/gps";
import { IconLocation } from "./Icons";

// Dark map style for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0A0A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A2A2A" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0A0A0A" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2A2A2A" }] },
];

interface RunMapProps {
  trackPoints: TrackPoint[];
  splits: Split[];
  isLive?: boolean;
  height?: number;
}

/**
 * In Expo Go, react-native-maps is NOT available (needs dev build).
 * We always use SVG fallback in Expo Go for reliability.
 * Set USE_NATIVE_MAPS = true when running a dev build.
 */
const USE_NATIVE_MAPS = false; // Set true only in dev builds

let MapView: any = null;
let MapPolyline: any = null;
let MapMarker: any = null;
let MapCircle: any = null;

if (USE_NATIVE_MAPS) {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    MapPolyline = Maps.Polyline;
    MapMarker = Maps.Marker;
    MapCircle = Maps.Circle;
  } catch {
    // fallback to SVG
  }
}

export const RunMap: React.FC<RunMapProps> = ({
  trackPoints,
  splits,
  isLive = false,
  height = 200,
}) => {
  const mapRef = useRef<any>(null);

  // No points yet
  if (trackPoints.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.empty}>
          <IconLocation size={24} color={colors.ash} />
          <Text style={styles.emptyText}>
            {isLive ? "ACQUIRING GPS..." : "NO ROUTE DATA"}
          </Text>
        </View>
      </View>
    );
  }

  // If Google Maps is available, use it
  if (MapView) {
    return (
      <GoogleMap
        mapRef={mapRef}
        trackPoints={trackPoints}
        splits={splits}
        isLive={isLive}
        height={height}
      />
    );
  }

  // Fallback: SVG map
  return (
    <SvgMap
      trackPoints={trackPoints}
      splits={splits}
      height={height}
    />
  );
};

// ─── Google Maps Implementation ───────────────────

const GoogleMap: React.FC<{
  mapRef: React.RefObject<any>;
  trackPoints: TrackPoint[];
  splits: Split[];
  isLive: boolean;
  height: number;
}> = ({ mapRef, trackPoints, splits, isLive, height }) => {
  const coordinates = useMemo(
    () => trackPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [trackPoints]
  );

  const firstPoint = trackPoints[0];
  const lastPoint = trackPoints[trackPoints.length - 1];

  // Auto-follow runner in live mode
  useEffect(() => {
    if (isLive && mapRef.current && lastPoint) {
      mapRef.current.animateToRegion(
        {
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        300
      );
    }
  }, [lastPoint?.latitude, lastPoint?.longitude, isLive]);

  // Fit to route when not live (summary view)
  useEffect(() => {
    if (!isLive && mapRef.current && coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  }, [isLive, coordinates.length]);

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={DARK_MAP_STYLE}
        provider="google"
        initialRegion={{
          latitude: firstPoint.latitude,
          longitude: firstPoint.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {/* Route polyline — neon yellow */}
        <MapPolyline
          coordinates={coordinates}
          strokeColor={colors.neonYellow}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Glow effect polyline (wider, transparent) */}
        <MapPolyline
          coordinates={coordinates}
          strokeColor="rgba(239, 255, 0, 0.15)"
          strokeWidth={12}
          lineCap="round"
          lineJoin="round"
        />

        {/* Start marker */}
        <MapMarker
          coordinate={{ latitude: firstPoint.latitude, longitude: firstPoint.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.startMarker}>
            <View style={styles.startMarkerInner} />
          </View>
        </MapMarker>

        {/* Current position (live) */}
        {isLive && (
          <>
            <MapCircle
              center={{ latitude: lastPoint.latitude, longitude: lastPoint.longitude }}
              radius={15}
              fillColor="rgba(239, 255, 0, 0.15)"
              strokeColor="rgba(239, 255, 0, 0.3)"
              strokeWidth={1}
            />
            <MapMarker
              coordinate={{ latitude: lastPoint.latitude, longitude: lastPoint.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.currentMarker} />
            </MapMarker>
          </>
        )}

        {/* Km markers */}
        {splits.map((split) => {
          const splitPoint = trackPoints.find((p) => p.timestamp >= split.endTimestamp);
          if (!splitPoint) return null;
          return (
            <MapMarker
              key={`km-${split.kmIndex}`}
              coordinate={{ latitude: splitPoint.latitude, longitude: splitPoint.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.kmMarker}>
                <Text style={styles.kmMarkerText}>{split.kmIndex}</Text>
              </View>
            </MapMarker>
          );
        })}
      </MapView>

      {/* GRIT watermark */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>GRIT</Text>
      </View>
    </View>
  );
};

// ─── SVG Fallback Map ─────────────────────────────

const SvgMap: React.FC<{
  trackPoints: TrackPoint[];
  splits: Split[];
  height: number;
}> = ({ trackPoints, splits, height }) => {
  const svgW = 345;
  const svgH = height;
  const padding = 20;

  const lats = trackPoints.map((p) => p.latitude);
  const lons = trackPoints.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const rangeX = maxLon - minLon || 0.001;
  const rangeY = maxLat - minLat || 0.001;

  const toX = (lon: number) => padding + ((lon - minLon) / rangeX) * (svgW - padding * 2);
  const toY = (lat: number) => svgH - padding - ((lat - minLat) / rangeY) * (svgH - padding * 2);

  const polyline = trackPoints.map((p) => `${toX(p.longitude)},${toY(p.latitude)}`).join(" ");
  const first = trackPoints[0];
  const last = trackPoints[trackPoints.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Grid */}
        {Array.from({ length: 5 }, (_, i) => (svgH / 4) * i).map((y) => (
          <Line key={`g${y}`} x1={0} y1={y} x2={svgW} y2={y} stroke={colors.graphite} strokeWidth={0.5} opacity={0.3} />
        ))}

        {/* Route */}
        <Polyline points={polyline} fill="none" stroke={colors.neonYellow} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Start */}
        <Circle cx={toX(first.longitude)} cy={toY(first.latitude)} r={4} fill="none" stroke={colors.offWhite} strokeWidth={1.5} />
        <Circle cx={toX(first.longitude)} cy={toY(first.latitude)} r={1.5} fill={colors.offWhite} />

        {/* Current */}
        <Circle cx={toX(last.longitude)} cy={toY(last.latitude)} r={6} fill={colors.neonYellow} />
        <Circle cx={toX(last.longitude)} cy={toY(last.latitude)} r={10} fill="none" stroke={colors.neonYellow} strokeWidth={1.5} opacity={0.4} />

        {/* Km markers */}
        {splits.map((split) => {
          const sp = trackPoints.find((p) => p.timestamp >= split.endTimestamp);
          if (!sp) return null;
          return (
            <G key={`km${split.kmIndex}`}>
              <Circle cx={toX(sp.longitude)} cy={toY(sp.latitude)} r={8} fill={colors.carbon} stroke={colors.steel} strokeWidth={1} />
              <SvgText x={toX(sp.longitude)} y={toY(sp.latitude) + 3.5} textAnchor="middle" fill={colors.offWhite} fontSize={8} fontWeight="600">{split.kmIndex}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.graphite,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.ash,
    letterSpacing: 3,
  },
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.8)",
  },
  startMarkerInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.offWhite,
  },
  currentMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.neonYellow,
    borderWidth: 2,
    borderColor: "rgba(239,255,0,0.4)",
  },
  kmMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  kmMarkerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.offWhite,
  },
  watermark: {
    position: "absolute",
    bottom: 8,
    right: 12,
  },
  watermarkText: {
    fontFamily: fonts.headlineBold,
    fontSize: 9,
    color: "rgba(239,255,0,0.35)",
    letterSpacing: 3,
  },
});
