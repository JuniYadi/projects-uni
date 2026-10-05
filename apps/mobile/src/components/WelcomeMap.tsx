import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const WORLD_MAP_WIDTH = 344;
export const WORLD_MAP_HEIGHT = 235;

// Exact SVG dotted world map path from univpn-v2-final.html
export const WORLD_MAP_DOTS_PATH =
  'M11 14h0M17 24h0M17 14h0M23 24h0M23 14h0M29 24h0M29 14h0M34 33h0M34 24h0M34 14h0M40 33h0M40 24h0M40 14h0M46 33h0M46 24h0M46 14h0M52 33h0M52 24h0M52 14h0M57 52h0M57 42h0M57 33h0M57 24h0M57 14h0M63 70h0M63 61h0M63 52h0M63 42h0M63 33h0M63 24h0M63 14h0M69 70h0M69 61h0M69 52h0M69 42h0M69 33h0M69 24h0M69 14h0M75 80h0M75 70h0M75 61h0M75 52h0M75 42h0M75 33h0M75 24h0M75 14h0M80 89h0M80 80h0M80 70h0M80 61h0M80 52h0M80 42h0M80 33h0M80 24h0M80 14h0M86 80h0M86 70h0M86 61h0M86 52h0M86 42h0M86 33h0M86 24h0M86 14h0M92 80h0M92 70h0M92 61h0M92 52h0M92 42h0M92 33h0M92 24h0M92 14h0M97 136h0M97 127h0M97 118h0M97 108h0M97 70h0M97 61h0M97 52h0M97 42h0M97 33h0M97 24h0M97 14h0M103 183h0M103 174h0M103 164h0M103 155h0M103 146h0M103 136h0M103 127h0M103 118h0M103 108h0M103 61h0M103 52h0M103 42h0M103 33h0M103 24h0M109 193h0M109 183h0M109 174h0M109 164h0M109 155h0M109 146h0M109 136h0M109 127h0M109 118h0M109 108h0M109 52h0M109 42h0M109 33h0M109 24h0M115 174h0M115 164h0M115 155h0M115 146h0M115 136h0M115 127h0M115 118h0M115 108h0M115 42h0M115 33h0M120 164h0M120 155h0M120 146h0M120 136h0M120 127h0M120 118h0M120 108h0M126 155h0M126 146h0M126 136h0M126 127h0M126 118h0M132 155h0M132 146h0M132 136h0M132 127h0M138 127h0M161 99h0M161 89h0M166 99h0M166 89h0M166 80h0M166 61h0M166 52h0M166 42h0M172 99h0M172 89h0M172 80h0M172 70h0M172 61h0M172 52h0M172 42h0M172 33h0M178 108h0M178 99h0M178 89h0M178 80h0M178 70h0M178 61h0M178 52h0M178 42h0M178 33h0M178 24h0M183 146h0M183 136h0M183 127h0M183 118h0M183 108h0M183 99h0M183 89h0M183 80h0M183 70h0M183 61h0M183 52h0M183 42h0M183 33h0M183 24h0M189 164h0M189 155h0M189 146h0M189 136h0M189 127h0M189 118h0M189 108h0M189 99h0M189 89h0M189 80h0M189 70h0M189 61h0M189 52h0M189 42h0M189 33h0M189 24h0M195 164h0M195 155h0M195 146h0M195 136h0M195 127h0M195 118h0M195 108h0M195 99h0M195 89h0M195 80h0M195 70h0M195 61h0M195 52h0M195 42h0M195 33h0M195 24h0M195 14h0M201 155h0M201 146h0M201 136h0M201 127h0M201 118h0M201 108h0M201 99h0M201 89h0M201 80h0M201 70h0M201 52h0M201 42h0M201 33h0M201 24h0M201 14h0M206 146h0M206 136h0M206 127h0M206 118h0M206 108h0M206 99h0M206 89h0M206 80h0M206 61h0M206 42h0M206 33h0M206 24h0M206 14h0M212 127h0M212 118h0M212 108h0M212 99h0M212 89h0M212 61h0M212 52h0M212 42h0M212 33h0M212 24h0M212 14h0M218 108h0M218 99h0M218 70h0M218 61h0M218 52h0M218 42h0M218 33h0M218 24h0M218 14h0M224 70h0M224 61h0M224 52h0M224 42h0M224 33h0M224 24h0M224 14h0M229 70h0M229 61h0M229 52h0M229 42h0M229 33h0M229 24h0M229 14h0M235 70h0M235 61h0M235 52h0M235 42h0M235 33h0M235 24h0M235 14h0M241 89h0M241 80h0M241 70h0M241 61h0M241 52h0M241 42h0M241 33h0M241 24h0M241 14h0M247 99h0M247 89h0M247 80h0M247 70h0M247 61h0M247 52h0M247 42h0M247 33h0M247 24h0M247 14h0M252 99h0M252 89h0M252 80h0M252 70h0M252 61h0M252 52h0M252 42h0M252 33h0M252 24h0M252 14h0M258 99h0M258 89h0M258 80h0M258 70h0M258 61h0M258 52h0M258 42h0M258 33h0M258 24h0M258 14h0M258 5h0M264 99h0M264 89h0M264 80h0M264 70h0M264 61h0M264 52h0M264 42h0M264 33h0M264 24h0M264 14h0M264 5h0M269 118h0M269 99h0M269 89h0M269 80h0M269 70h0M269 61h0M269 52h0M269 42h0M269 33h0M269 24h0M269 14h0M269 5h0M275 127h0M275 118h0M275 99h0M275 89h0M275 80h0M275 70h0M275 61h0M275 52h0M275 42h0M275 33h0M275 24h0M275 14h0M275 5h0M281 127h0M281 118h0M281 89h0M281 80h0M281 70h0M281 61h0M281 52h0M281 42h0M281 33h0M281 24h0M281 14h0M281 5h0M287 164h0M287 155h0M287 146h0M287 127h0M287 118h0M287 80h0M287 70h0M287 61h0M287 52h0M287 42h0M287 33h0M287 24h0M287 14h0M287 5h0M292 164h0M292 155h0M292 146h0M292 127h0M292 118h0M292 70h0M292 61h0M292 52h0M292 42h0M292 33h0M292 24h0M292 14h0M292 5h0M298 164h0M298 155h0M298 146h0M298 136h0M298 127h0M298 61h0M298 52h0M298 42h0M298 33h0M298 24h0M298 14h0M298 5h0M304 164h0M304 155h0M304 146h0M304 136h0M304 127h0M304 52h0M304 42h0M304 33h0M304 24h0M304 14h0M310 174h0M310 164h0M310 155h0M310 146h0M310 42h0M310 33h0M310 24h0M310 14h0M315 164h0M315 155h0M315 33h0M315 24h0M315 14h0M321 24h0M321 14h0M327 14h0';

export const USER_LOCATION = { x: 274, y: 127 };

export const SERVERS = [
  { id: 'sg', x: 271, y: 115, r: 4, arc: 'M274 127 Q273 115 271 115', len: 20, delay: 300, arcDelay: 600, opacity: 1.0 },
  { id: 'hk', x: 281, y: 83, r: 3, arc: 'M274 127 Q278 81 281 83', len: 55, delay: 500, arcDelay: 850, opacity: 0.45 },
  { id: 'jp', x: 305, y: 62, r: 3, arc: 'M274 127 Q290 53 305 62', len: 85, delay: 700, arcDelay: 1100, opacity: 0.45 },
  { id: 'us-w', x: 59, y: 64, r: 3, arc: 'M274 127 Q167 4 59 64', len: 250, delay: 900, arcDelay: 1350, opacity: 0.45 },
  { id: 'us-e', x: 80, y: 66, r: 3, arc: 'M274 127 Q177 12 80 66', len: 230, delay: 1100, arcDelay: 1600, opacity: 0.45 },
];

export const WELCOME_MAP_MS = 2400;

/** Faint flat dotted world map; also used on the splash. */
export function MapGrid({ height = 235 }: { height?: number }) {
  const theme = useTheme();
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 344 235"
      style={{ overflow: 'visible' }}
    >
      <Path
        d={WORLD_MAP_DOTS_PATH}
        fill="none"
        stroke={theme.isDark ? '#94A3B8' : '#64748B'}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={theme.isDark ? 0.45 : 0.35}
      />
    </Svg>
  );
}

function ServerNode({
  server,
  accent,
  reduced,
}: {
  server: (typeof SERVERS)[number];
  accent: string;
  reduced: boolean;
}) {
  const progress = useSharedValue(reduced ? 1 : 0);
  const srvOpacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    srvOpacity.set(withDelay(server.delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })));
    progress.set(withDelay(server.arcDelay, withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) })));
  }, [reduced, server, progress, srvOpacity]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: server.len * (1 - progress.value),
    opacity: server.opacity * progress.value,
  }));

  const srvProps = useAnimatedProps(() => ({
    opacity: srvOpacity.value,
  }));

  return (
    <>
      <AnimatedPath
        d={server.arc}
        fill="none"
        stroke={accent}
        strokeWidth={1.6}
        strokeDasharray={server.len}
        animatedProps={arcProps}
      />
      <AnimatedCircle
        cx={server.x}
        cy={server.y}
        r={server.r}
        fill={accent}
        animatedProps={srvProps}
      />
    </>
  );
}

/**
 * Welcome map:
 * User location pulses -> 5 servers appear -> curved flight arcs draw to servers -> onDone (<=2.4s).
 */
export function WelcomeMap({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return onDone();

    pulse.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) })
        ),
        -1
      )
    );

    const timer = setTimeout(() => {
      scheduleOnRN(onDone);
    }, WELCOME_MAP_MS);

    return () => clearTimeout(timer);
  }, [reduced, onDone, pulse]);

  const pulseProps = useAnimatedProps(() => ({
    r: 6 + 18 * pulse.value,
    opacity: 0.45 * (1 - pulse.value),
  }));

  return (
    <View
      accessible
      accessibilityLabel="Peta: kamu terhubung ke server tercepat"
      style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg
        width="100%"
        height={220}
        viewBox="0 0 344 235"
        style={{ overflow: 'visible' }}
      >
        {/* Dotted World Continents */}
        <Path
          d={WORLD_MAP_DOTS_PATH}
          fill="none"
          stroke={theme.isDark ? '#94A3B8' : '#64748B'}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={theme.isDark ? 0.45 : 0.35}
        />

        {/* 5 Servers + Arcs */}
        {SERVERS.map((server) => (
          <ServerNode
            key={server.id}
            server={server}
            accent={theme.accent}
            reduced={Boolean(reduced)}
          />
        ))}

        {/* User pulsing location (Indonesia) */}
        {!reduced && (
          <AnimatedCircle
            cx={USER_LOCATION.x}
            cy={USER_LOCATION.y}
            fill={theme.accent}
            animatedProps={pulseProps}
          />
        )}
        <Circle
          cx={USER_LOCATION.x}
          cy={USER_LOCATION.y}
          r={4.5}
          fill="#FFFFFF"
          stroke={theme.accent}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}
