import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
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
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const breathe = useSharedValue(0);
  const spin = useSharedValue(0);
  const shake = useSharedValue(0);
  const beat = useSharedValue(0);
  useEffect(() => {
    [pop, ripple1, ripple2, breathe, spin, shake, beat].forEach(cancelAnimation);
    pop.set(1); ripple1.set(0); ripple2.set(0); breathe.set(0); spin.set(0); shake.set(0); beat.set(0);
    if (reduced) return; // jump straight to the end state
    if (status === 'connecting') {
      spin.set(withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1));
    } else if (status === 'connected') {
      // Pop bounce
      pop.set(withSequence(withTiming(0.85, { duration: 50 }), withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 140 })));
      // Continuous Ripple 1 (2.4s cycle)
      ripple1.set(withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 2400, easing: Easing.bezier(0.1, 0.4, 0.3, 1) })), -1));
      // Continuous Ripple 2 (staggered delay 1200ms)
      ripple2.set(withDelay(1200, withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 2400, easing: Easing.bezier(0.1, 0.4, 0.3, 1) })), -1)));
      // Continuous gentle breathing pulse while connected (3s cycle)
      breathe.set(withRepeat(withSequence(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })), -1, true));
    } else if (status === 'failed') {
      shake.set(withSequence(...[-8, 8, -5, 5, 0].map((x) => withTiming(x, { duration: 70 }))));
    } else if (status === 'dropped') {
      beat.set(withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) })), -1));
    }
  }, [status, reduced, pop, ripple1, ripple2, breathe, spin, shake, beat]);

  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { scale: pop.value }] }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const ripple1Style = useAnimatedStyle(() => ({ opacity: 0.85 * (1 - ripple1.value), transform: [{ scale: 1 + 0.65 * ripple1.value }] }));
  const ripple2Style = useAnimatedStyle(() => ({ opacity: 0.85 * (1 - ripple2.value), transform: [{ scale: 1 + 0.65 * ripple2.value }] }));
  const breatheStyle = useAnimatedStyle(() => ({ opacity: 0.16 + 0.18 * breathe.value, transform: [{ scale: 1 + 0.12 * breathe.value }] }));
  const beatStyle = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - beat.value), transform: [{ scale: 1 + 0.5 * beat.value }] }));

  const bad = status === 'failed' || status === 'dropped';
  const on = status === 'connected';
  const text = Strings.connection[status];
  const ring = { position: 'absolute', width: size, height: size, borderRadius: size / 2 } as const;
  const glowRing1 = { position: 'absolute', width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 } as const;
  const glowRing2 = { position: 'absolute', width: size + 52, height: size + 52, borderRadius: (size + 52) / 2 } as const;

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {/* Circular button container */}
      <View style={{ width: size + 64, height: size + 64, alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer static & animated glow rings matching design */}
        {status === 'idle' && (
          <View style={[glowRing1, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }]} />
        )}
        {status === 'connecting' && (
          <View style={[glowRing1, { backgroundColor: `${theme.accent}22` }]} />
        )}
        {on && (
          <>
            <Animated.View style={[glowRing2, { backgroundColor: `${theme.accent}20` }, breatheStyle]} />
            <View style={[glowRing1, { backgroundColor: `${theme.accent}22` }]} />
            <Animated.View style={[ring, { borderWidth: 2, borderColor: theme.accent }, ripple1Style]} />
            <Animated.View style={[ring, { borderWidth: 2, borderColor: theme.accent }, ripple2Style]} />
          </>
        )}
        {status === 'dropped' && (
          <Animated.View style={[ring, { backgroundColor: theme.error }, beatStyle]} />
        )}
        {status === 'failed' && (
          <View style={[glowRing1, { backgroundColor: `${theme.error}22` }]} />
        )}

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
              borderColor: bad ? theme.error : on ? theme.accent : theme.backgroundSelected,
              opacity: disabled ? 0.5 : 1,
              shadowColor: on ? theme.accent : '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: on ? 0.35 : 0.08,
              shadowRadius: 16,
              elevation: on ? 8 : 2,
            }}
          >
            {status === 'connecting' && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: size * 0.72,
                    height: size * 0.72,
                    borderRadius: size,
                    borderWidth: 3.5,
                    borderColor: `${theme.accent}33`,
                    borderTopColor: theme.accent,
                  },
                  spinStyle,
                ]}
              />
            )}
            {bad ? (
              <Icon name="alert" size={Math.round(size * 0.38)} color={theme.error} strokeWidth={2} />
            ) : (
              <Icon
                name="power"
                size={Math.round(size * 0.38)}
                color={on ? '#052E16' : status === 'connecting' ? theme.accent : theme.powerIconIdle}
                strokeWidth={2.2}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Status Title & Hint */}
      <Animated.View key={status} entering={FadeIn.duration(textMs)} style={{ alignItems: 'center', gap: 6, marginTop: 28, paddingHorizontal: 20 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: Figtree.semibold,
            fontSize: 20,
            color: bad ? theme.error : theme.text,
            textAlign: 'center',
          }}
        >
          {text.title}
        </Text>
        <Text
          style={{
            fontFamily: Figtree.regular,
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center',
          }}
        >
          {text.hint}
        </Text>
      </Animated.View>

      {/* Actions (only for connecting, failed, dropped) */}
      {(status === 'connecting' || bad) && (
        <View style={{ alignSelf: 'stretch', paddingHorizontal: 20, marginTop: 28, gap: 10 }}>
          {status === 'connecting' && <Button variant="secondary" label={Strings.actions.cancel} onPress={onCancel} />}
          {status === 'failed' && <Button label={Strings.actions.retry} onPress={onRetry} />}
          {status === 'dropped' && (
            <>
              <Button label={Strings.actions.reconnect} onPress={onReconnect} />
              {onUseWithoutVpn && (
                <Pressable onPress={onUseWithoutVpn} style={{ paddingVertical: 8 }}>
                  <Text style={{ fontFamily: Figtree.medium, fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                    {Strings.actions.useWithoutVpn}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
