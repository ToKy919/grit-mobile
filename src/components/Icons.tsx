/**
 * GRIT — Premium SVG Icons (React Native)
 */

import React from "react";
import Svg, { Path, Circle, Rect, Line, Polygon, Polyline } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const IconHome: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <Path d="M9 21V13h6v8" />
  </Svg>
);

export const IconTrack: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={8} />
    <Circle cx={12} cy={12} r={3} />
    <Line x1={12} y1={2} x2={12} y2={4} />
    <Line x1={12} y1={20} x2={12} y2={22} />
    <Line x1={2} y1={12} x2={4} y2={12} />
    <Line x1={20} y1={12} x2={22} y2={12} />
  </Svg>
);

export const IconHyrox: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
    <Polygon points="12,8 16,10.5 16,15.5 12,18 8,15.5 8,10.5" />
  </Svg>
);

export const IconStats: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={14} width={4} height={7} rx={1} />
    <Rect x={10} y={8} width={4} height={13} rx={1} />
    <Rect x={17} y={3} width={4} height={18} rx={1} />
  </Svg>
);

export const IconStudio: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={2} y={4} width={20} height={16} rx={2} />
    <Polygon points="10,9 16,12 10,15" fill={color} stroke="none" />
  </Svg>
);

export const IconHeart: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </Svg>
);

export const IconPace: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={14} cy={4} r={2} />
    <Path d="M6 20l3-7 3 2v5" />
    <Path d="M9 13l2.12-4.24A2 2 0 0112.9 7.8L16 9l-2 4" />
    <Path d="M16 9l3 5h-4" />
  </Svg>
);

export const IconFire: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22c4.97 0 8-3.03 8-8 0-4-2.5-7.5-4-9-.5 2.5-2 4.5-4 6-2-1.5-3-4-3-6.5C5.5 7 4 11 4 14c0 4.97 3.03 8 8 8z" />
  </Svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="6,12 10,16 18,8" />
  </Svg>
);

export const IconLock: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={5} y={11} width={14} height={10} rx={2} />
    <Path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={5} y1={12} x2={19} y2={12} />
    <Polyline points="12,5 19,12 12,19" />
  </Svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={8} r={4} />
    <Path d="M20 21a8 8 0 10-16 0" />
  </Svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={7} y1={17} x2={17} y2={7} />
    <Polyline points="7,7 17,7 17,17" />
  </Svg>
);

export const IconTimer: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={13} r={8} />
    <Line x1={12} y1={9} x2={12} y2={13} />
    <Line x1={10} y1={2} x2={14} y2={2} />
    <Line x1={12} y1={2} x2={12} y2={5} />
  </Svg>
);

export const IconElevation: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 20L9 6l4 8 3-4 6 10H2z" />
  </Svg>
);

export const IconLocation: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
    <Circle cx={12} cy={10} r={3} />
  </Svg>
);

export const IconPause: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={6} y={4} width={4} height={16} rx={1} />
    <Rect x={14} y={4} width={4} height={16} rx={1} />
  </Svg>
);

export const IconStop: React.FC<IconProps> = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={5} width={14} height={14} rx={2} fill={color} />
  </Svg>
);

export const IconStar: React.FC<IconProps> = ({ size = 24, color = "currentColor", strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </Svg>
);
