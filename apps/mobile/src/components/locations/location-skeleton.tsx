import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

/** Loading placeholder rows. Static when reduced-motion is on. */
export function LocationSkeleton({ rows = 5 }: { rows?: number }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (!reduced) o.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
  }, [reduced, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View accessibilityLabel="Memuat lokasi" style={style}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.backgroundSelected }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 12, width: '45%', borderRadius: 6, backgroundColor: theme.backgroundSelected }} />
            <View style={{ height: 10, width: '25%', borderRadius: 5, backgroundColor: theme.backgroundSelected }} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
