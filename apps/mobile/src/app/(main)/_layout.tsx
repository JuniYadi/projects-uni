import { useRef, useCallback, type ComponentType } from 'react';
import { View, Pressable, Text, Animated, useColorScheme } from 'react-native';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingConnectButton } from '@/components/FloatingConnectButton';

// ─── View-based icons (no SVG dependency) ──────────────

function ServersIcon({ color, size = 22 }: { color: string; size?: number }) {
  const bar = (y: number, w: number) => ({
    width: size * w,
    height: size * 0.18,
    borderRadius: size * 0.08,
    backgroundColor: color,
    marginTop: y > 0 ? size * 0.12 : 0,
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={bar(0, 0.55)} />
      <View style={bar(1, 0.7)} />
      <View style={bar(2, 0.55)} />
    </View>
  );
}

function SettingsIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size * 0.39,
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: size * 0.16,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

// ─── Tab Button ──────────────────────────────────────────

function TabItem({
  isFocused,
  onPress,
  onLongPress,
  label,
  icon: Icon,
  isDark,
}: TabTriggerSlotProps & { label: string; icon: ComponentType<{ color: string }>; isDark: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#8e8e93';
  const color = isFocused ? activeColor : inactiveColor;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 2 }}>
        <Icon color={color} />
        <Text
          style={{
            fontSize: 9,
            fontWeight: '600',
            color,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Layout ────────────────────────────────────────

export default function MainLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />

      <TabList asChild>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: bg,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: Math.max(insets.bottom - 6, 4),
            paddingTop: 6,
            paddingHorizontal: 16,
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* ── Servers tab ── */}
          <TabTrigger name="servers" href="/(main)/servers" asChild>
            <TabItem label="Servers" icon={ServersIcon} isDark={isDark} />
          </TabTrigger>

          {/* ── Center: connect dock with shape ── */}
          <View pointerEvents="box-none" style={{ flex: 1.2, alignItems: 'center' }}>
            {/* Circle plate — makes the featured button prominent */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -28,
                width: 86,
                height: 86,
                borderRadius: 43,
                backgroundColor: bg,
              }}
            />
            <View pointerEvents="box-none" style={{ marginTop: -14 }}>
              <FloatingConnectButton />
            </View>
          </View>

          {/* ── Settings tab ── */}
          <TabTrigger name="settings" href="/(main)/settings" asChild>
            <TabItem label="Settings" icon={SettingsIcon} isDark={isDark} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}
