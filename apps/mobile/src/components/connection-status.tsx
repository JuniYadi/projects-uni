import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Figtree } from '@/constants/theme';
import { Motion, useMotionDuration } from '@/constants/motion';
import { Strings } from '@/constants/strings';
import { useTheme } from '@/hooks/use-theme';
import type { ConnectionUiStatus } from '@/types/connection';

type Props = {
  status: ConnectionUiStatus;
  /** Diameter of the big round button (smaller on small phones). */
  size: number;
  /** Tapping the big button. Ignored while connecting. */
  onPress: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
  onUseWithoutVpn?: () => void;
  /** Disable connecting (no location yet). */
  disabled?: boolean;
};

/** Big round button + one status sentence + the actions of each of the 5 states. */
export function ConnectionStatus({
  status, size, onPress, onCancel, onRetry, onReconnect, onDisconnect, onUseWithoutVpn, disabled,
}: Props) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const textMs = useMotionDuration(Motion.text);
  const pop = useSharedValue(1);
  const ripple = useSharedValue(0);
  const spin = useSharedValue(0);
  const shake = useSharedValue(0);
  const beat = useSharedValue(0);

  useEffect(() => {
    [pop, ripple, spin, shake, beat].forEach(cancelAnimation);
    pop.set(1); ripple.set(0); spin.set(0); shake.set(0); beat.set(0);
    if (reduced) return; // jump straight to the end state
    if (status === 'connecting') {
      spin.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1));
    } else if (status === 'connected') {
      pop.set(withSequence(withTiming(0.85, { duration: 0 }), withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 140 })));
      ripple.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) })));
    } else if (status === 'failed') {
      shake.set(withSequence(...[-8, 8, -5, 5, 0].map((x) => withTiming(x, { duration: 70 }))));
    } else if (status === 'dropped') {
      beat.set(withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) })), -1));
    }
  }, [status, reduced, pop, ripple, spin, shake, beat]);

  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { scale: pop.value }] }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const rippleStyle = useAnimatedStyle(() => ({ opacity: 0.7 * (1 - ripple.value), transform: [{ scale: 1 + 0.9 * ripple.value }] }));
  const beatStyle = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - beat.value), transform: [{ scale: 1 + 0.5 * beat.value }] }));

  const bad = status === 'failed' || status === 'dropped';
  const on = status === 'connected';
  const text = Strings.connection[status];
  const ring = { position: 'absolute', width: size, height: size, borderRadius: size / 2 } as const;

  return (
    <View style={{ alignItems: 'center', gap: 20 }}>
      <View style={{ width: size * 1.9, height: size * 1.9, alignItems: 'center', justifyContent: 'center' }}>
        {status === 'dropped' && <Animated.View style={[ring, { backgroundColor: theme.error }, beatStyle]} />}
        {on && <Animated.View style={[ring, { borderWidth: 2, borderColor: theme.accent }, rippleStyle]} />}
        <Animated.View style={buttonStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.title}
            accessibilityHint={text.hint}
            disabled={disabled || status === 'connecting'}
            onPress={onPress}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? theme.accent : theme.backgroundElement,
              borderWidth: 1,
              borderColor: bad ? theme.error : theme.backgroundSelected,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {status === 'connecting' && (
              <Animated.View
                style={[
                  { position: 'absolute', width: size * 0.7, height: size * 0.7, borderRadius: size, borderWidth: 4, borderColor: `${theme.accent}44`, borderTopColor: theme.accent },
                  spinStyle,
                ]}
              />
            )}
            <Icon name="shield" size={size * 0.38} color={on ? '#0F172A' : bad ? theme.error : theme.textSecondary} />
          </Pressable>
        </Animated.View>
      </View>

      {/* key → remount → fade-in on every status change */}
      <Animated.View key={status} entering={FadeIn.duration(textMs)} style={{ alignItems: 'center', gap: 4, paddingHorizontal: 24 }}>
        <Text accessibilityRole="header" style={{ fontFamily: Figtree.semibold, fontSize: 22, color: theme.text, textAlign: 'center' }}>
          {text.title}
        </Text>
        <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
          {text.hint}
        </Text>
      </Animated.View>

      <View style={{ alignSelf: 'stretch', paddingHorizontal: 32, gap: 8, minHeight: 104 }}>
        {status === 'connecting' && <Button variant="secondary" label={Strings.actions.cancel} onPress={onCancel} />}
        {status === 'connected' && <Button variant="secondary" label={Strings.actions.disconnect} onPress={onDisconnect} />}
        {status === 'failed' && <Button label={Strings.actions.retry} onPress={onRetry} />}
        {status === 'dropped' && (
          <>
            <Button label={Strings.actions.reconnect} onPress={onReconnect} />
            {onUseWithoutVpn && <Button variant="secondary" label={Strings.actions.useWithoutVpn} onPress={onUseWithoutVpn} />}
          </>
        )}
      </View>
    </View>
  );
}
