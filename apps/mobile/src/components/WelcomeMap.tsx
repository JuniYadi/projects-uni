import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  type SharedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const W = 320;
const H = 200;
// Decorative: you (bottom-left) and 5 servers; the fastest one is index 2.
const USER = { x: 60, y: 150 };
const SERVERS = [
  { x: 110, y: 50 },
  { x: 190, y: 90 },
  { x: 235, y: 135 },
  { x: 250, y: 45 },
  { x: 285, y: 95 },
];
const FASTEST = SERVERS[2];
const LINE_LEN = Math.hypot(FASTEST.x - USER.x, FASTEST.y - USER.y);
export const WELCOME_MAP_MS = 2400;

function ramp(v: number, a: number, b: number) {
  'worklet';
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}

/** Faint flat dot-grid "map"; also used on the splash. */
export function MapGrid({ height = 200 }: { height?: number }) {
  const theme = useTheme();
  const dots = [];
  for (let x = 10; x < W; x += 20) for (let y = 10; y < H; y += 20) dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />);
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`} fill={theme.textSecondary} opacity={0.25}>
      {dots}
    </Svg>
  );
}

/**
 * Welcome map: you pulse → 5 servers appear → line to the fastest → `onDone` (once, ≤2.4s).
 * With reduced motion it renders the final frame and calls `onDone` immediately.
 */
export function WelcomeMap({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return onDone();
    p.set(withTiming(1, { duration: WELCOME_MAP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(onDone);
    }));
  }, [reduced]);

  const pulse = useAnimatedProps(() => {
    const t = ramp(p.value, 0, 0.3);
    return { r: 6 + 22 * t, opacity: reduced ? 0 : 0.5 * (1 - t) };
  });
  const line = useAnimatedProps(() => ({ strokeDashoffset: LINE_LEN * (1 - ramp(p.value, 0.65, 0.95)) }));

  return (
    <View accessible accessibilityLabel="Peta: kamu terhubung ke server tercepat" style={{ width: '100%' }}>
      <View style={{ position: 'absolute', left: 0, right: 0 }}>
        <MapGrid />
      </View>
      <Svg width="100%" height={200} viewBox={`0 0 ${W} ${H}`}>
        <AnimatedLine
          x1={USER.x} y1={USER.y} x2={FASTEST.x} y2={FASTEST.y}
          stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={LINE_LEN}
          animatedProps={line}
        />
        <AnimatedCircle cx={USER.x} cy={USER.y} fill={theme.accent} animatedProps={pulse} />
        <Circle cx={USER.x} cy={USER.y} r={7} fill={theme.accent} />
        {SERVERS.map((s, i) => (
          <ServerDot key={i} {...s} i={i} p={p} />
        ))}
      </Svg>
    </View>
  );
}

function ServerDot({ x, y, i, p }: { x: number; y: number; i: number; p: SharedValue<number> }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const fast = SERVERS[i] === FASTEST;
  const animatedProps = useAnimatedProps(() => ({
    opacity: reduced ? 1 : ramp(p.value, 0.3 + i * 0.07, 0.4 + i * 0.07),
  }));
  return (
    <AnimatedCircle
      cx={x} cy={y} r={fast ? 7 : 5}
      fill={fast ? theme.accent : theme.textSecondary}
      animatedProps={animatedProps}
    />
  );
}
