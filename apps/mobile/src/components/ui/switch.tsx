import { Pressable } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { Ease, Motion, useMotionDuration } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';

const W = 48;
const H = 28;
const KNOB = 22;

export function Switch({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
}) {
  const theme = useTheme();
  const duration = useMotionDuration(Motion.press);
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration, easing: Ease.out }), [value, duration]);
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.backgroundSelected, theme.accent]),
  }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: 3 + progress.value * (W - KNOB - 6) }] }));

  return (
    // 44px-high hit area around the 28px track
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={{ minHeight: 44, minWidth: 48, justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: W, height: H, borderRadius: H / 2, justifyContent: 'center' }, track]}>
        <Animated.View
          style={[{ width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#FFFFFF' }, knob]}
        />
      </Animated.View>
    </Pressable>
  );
}
