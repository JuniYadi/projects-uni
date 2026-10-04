import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ease, Motion, useMotionDuration } from '@/constants/motion';

/**
 * Shared enter/exit animation for Sheet and Dialog.
 * Keeps the Modal mounted until the exit animation finishes.
 */
export function Overlay({
  visible,
  onClose,
  kind,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  kind: 'sheet' | 'dialog';
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true); // render-phase sync, avoids effect setState
  const p = useSharedValue(0);
  const sheet = kind === 'sheet';
  const inMs = useMotionDuration(sheet ? Motion.sheetIn : Motion.dialogIn);
  const outMs = useMotionDuration(sheet ? Motion.sheetOut : Motion.dialogOut);

  useEffect(() => {
    if (visible) {
      p.value = withTiming(1, { duration: inMs, easing: sheet ? Ease.sheet : Ease.out });
    } else {
      p.value = withTiming(0, { duration: outMs, easing: Ease.in }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  const content = useAnimatedStyle(() =>
    sheet
      ? { transform: [{ translateY: (1 - p.value) * height * 0.5 }], opacity: p.value }
      : { transform: [{ scale: 0.92 + 0.08 * p.value }], opacity: p.value },
  );

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,6,23,0.6)' }, scrim]}>
        <Pressable accessibilityLabel="Tutup" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[
          StyleSheet.absoluteFill,
          { justifyContent: sheet ? 'flex-end' : 'center', padding: sheet ? 0 : 24 },
          content,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
