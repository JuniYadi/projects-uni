import { Pressable, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Figtree } from '@/constants/theme';
import { Ease, Motion, useMotionDuration } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', disabled, ...rest }: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const duration = useMotionDuration(Motion.press);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const primary = variant === 'primary';

  return (
    <Animated.View style={[style, { opacity: disabled ? 0.5 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={() => scale.set(withTiming(0.97, { duration, easing: Ease.out }))}
        onPressOut={() => scale.set(withTiming(1, { duration, easing: Ease.out }))}
        style={{
          minHeight: 48,
          paddingHorizontal: 20,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? theme.accent : theme.backgroundElement,
          borderWidth: primary ? 0 : 1,
          borderColor: theme.backgroundSelected,
        }}
        {...rest}
      >
        <Text
          style={{
            fontFamily: Figtree.semibold,
            fontSize: 15,
            color: primary ? '#052E16' : theme.text,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
