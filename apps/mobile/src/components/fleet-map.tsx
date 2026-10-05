import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DETAIL_MAP_DOTS_PATH } from '@/constants/world-map-dots';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { VpnProfile } from '@/types/vpn';
import type { UserLocation } from '@/services/geoLocationService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface FleetMapProps {
  profiles: VpnProfile[];
  activeProfileId: string | null;
  selectedProfileId?: string | null;
  height?: number;
  userLocation?: UserLocation | null;
}

// Fallback coordinates for servers when p.latitude / p.longitude are not provided
const FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  ID: { lat: -6.2088, lng: 106.8456 },
  SG: { lat: 1.3521, lng: 103.8198 },
  HK: { lat: 22.3193, lng: 114.1694 },
  JP: { lat: 35.6762, lng: 139.6503 },
  US: { lat: 34.0522, lng: -118.2437 },
  NL: { lat: 52.3676, lng: 4.9041 },
  DE: { lat: 50.1109, lng: 8.6821 },
};

/**
 * Projects latitude and longitude to (x, y) in the 320x170 SVG world map coordinate space.
 * Equirectangular projection centered at longitude 0 (Greenwich) at x=160, equator at y=85.
 */
export function projectCoords(lat: number, lng: number): { x: number; y: number } {
  let nLng = lng;
  while (nLng > 180) nLng -= 360;
  while (nLng < -180) nLng += 360;

  const x = Math.round(160 + nLng * (320 / 360));
  const y = Math.round(85 - lat * 1.12);

  return {
    x: Math.max(12, Math.min(308, x)),
    y: Math.max(12, Math.min(158, y)),
  };
}

/**
 * Computes quadratic bezier SVG curve path between user location and VPN server.
 */
function getArcD(uX: number, uY: number, sX: number, sY: number): string {
  const dist = Math.hypot(sX - uX, sY - uY);
  if (dist < 4) {
    // If coords are virtually identical, draw a small arc loop
    return `M ${uX - 6} ${uY} A 6 6 0 1 0 ${uX + 6} ${uY}`;
  }

  // Handle wrap across international date line if distance > half map width
  let targetX = sX;
  if (uX - sX > 160) {
    targetX = sX + 320;
  } else if (sX - uX > 160) {
    targetX = sX - 320;
  }

  const midX = (uX + targetX) / 2;
  const arch = Math.max(10, Math.min(45, dist * 0.28));
  const midY = Math.min(uY, sY) - arch;

  return `M ${uX} ${uY} Q ${midX} ${midY} ${sX} ${sY}`;
}

export default function FleetMap({
  profiles,
  activeProfileId,
  selectedProfileId = activeProfileId,
  height = 190,
  userLocation,
}: FleetMapProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // User coordinate (origin) - defaults to Jakarta, Indonesia if not yet available
  const userLat = userLocation?.lat ?? -6.2088;
  const userLng = userLocation?.lng ?? 106.8456;
  const userCoords = projectCoords(userLat, userLng);

  // Active / Selected server
  const targetServer =
    profiles.find((p) => p.id === activeProfileId) ||
    profiles.find((p) => p.id === selectedProfileId) ||
    profiles[0];

  const serverFallback = targetServer ? FALLBACK_COORDS[targetServer.countryCode] : null;
  const serverLat = targetServer?.latitude ?? serverFallback?.lat ?? 1.3521;
  const serverLng = targetServer?.longitude ?? serverFallback?.lng ?? 103.8198;
  const serverCoords = projectCoords(serverLat, serverLng);

  const arcD = getArcD(userCoords.x, userCoords.y, serverCoords.x, serverCoords.y);

  // Other inactive servers to display faint location dots
  const otherServers = profiles
    .filter((p) => p.id !== targetServer?.id)
    .map((p) => {
      const fb = FALLBACK_COORDS[p.countryCode];
      const lat = p.latitude ?? fb?.lat ?? 0;
      const lng = p.longitude ?? fb?.lng ?? 0;
      return { id: p.id, ...projectCoords(lat, lng) };
    });

  // Pulse animation for user beacon
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, Easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, [reduced, pulse]);

  const pulseProps = useAnimatedProps(() => ({
    r: 4.5 + pulse.value * 7,
    opacity: 0.8 * (1 - pulse.value),
  }));

  const userLabel = userLocation?.city
    ? `${userLocation.city}, ${userLocation.country}`
    : userLocation?.country || 'Indonesia (Kamu)';
  const serverLabel = targetServer
    ? `${targetServer.city ? `${targetServer.city}, ` : ''}${targetServer.country || targetServer.name}`
    : 'Singapore';

  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.isDark ? '#192134' : '#FFFFFF',
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 170"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Dotted World Map Base */}
        <Path
          d={DETAIL_MAP_DOTS_PATH}
          stroke={theme.isDark ? '#334155' : '#CBD5E1'}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Inactive fleet nodes */}
        {otherServers.map((srv) => (
          <Circle
            key={srv.id}
            cx={srv.x}
            cy={srv.y}
            r={3}
            fill="#22C55E"
            opacity={0.35}
          />
        ))}

        {/* Connection Arc */}
        <Path
          d={arcD}
          fill="none"
          stroke="#22C55E"
          strokeWidth={2}
          strokeDasharray="4, 3"
          strokeOpacity={0.9}
        />

        {/* Server Target Node */}
        <G>
          <Circle cx={serverCoords.x} cy={serverCoords.y} r={6.5} fill="rgba(34, 197, 94, 0.25)" />
          <Circle cx={serverCoords.x} cy={serverCoords.y} r={4} fill="#22C55E" />
        </G>

        {/* User Beacon Node (Origin) */}
        <G>
          <AnimatedCircle
            cx={userCoords.x}
            cy={userCoords.y}
            stroke="#22C55E"
            strokeWidth={1.5}
            fill="none"
            animatedProps={pulseProps}
          />
          <Circle
            cx={userCoords.x}
            cy={userCoords.y}
            r={4.5}
            fill="#FFFFFF"
            stroke="#22C55E"
            strokeWidth={2}
          />
        </G>
      </Svg>

      {/* Floating Info Overlay Bar at the bottom */}
      <View
        style={{
          position: 'absolute',
          bottom: 8,
          left: 10,
          right: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(248, 250, 252, 0.88)',
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: Figtree.medium,
            fontSize: 11,
            color: theme.textSecondary,
            maxWidth: '44%',
          }}
        >
          {userLabel}
        </Text>
        <Text style={{ fontFamily: Figtree.semibold, fontSize: 11, color: '#22C55E' }}>
          →
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: Figtree.semibold,
            fontSize: 11,
            color: theme.text,
            maxWidth: '44%',
            textAlign: 'right',
          }}
        >
          {serverLabel}
        </Text>
      </View>
    </View>
  );
}
