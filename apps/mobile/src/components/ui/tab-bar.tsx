import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Figtree } from '@/constants/theme';
import { useIsTablet } from '@/hooks/use-is-tablet';
import { useTheme } from '@/hooks/use-theme';
import { Icon, type IconName } from './icon';

/** Container for 3 `TabBarItem`s: bottom bar on phones, side rail on tablets. */
export function TabBar({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tablet = useIsTablet();
  return (
    <View
      style={
        tablet
          ? {
              width: 96,
              backgroundColor: theme.backgroundElement,
              paddingTop: Math.max(insets.top, 8) + 8,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingLeft: insets.left,
              gap: 8,
            }
          : {
              flexDirection: 'row',
              backgroundColor: theme.backgroundElement,
              borderTopWidth: 1,
              borderTopColor: theme.backgroundSelected,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
            }
      }
    >
      {children}
    </View>
  );
}

/** Use as `<TabTrigger asChild><TabBarItem label=… icon=… /></TabTrigger>`. */
export function TabBarItem({
  isFocused,
  label,
  icon,
  ...rest
}: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  const tablet = useIsTablet();
  const color = isFocused ? theme.accent : theme.textSecondary;
  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{
        flex: tablet ? undefined : 1,
        minHeight: tablet ? 64 : 48,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Icon name={icon} color={color} size={24} />
      <Text style={{ fontFamily: Figtree.medium, fontSize: 12, color }}>{label}</Text>
    </Pressable>
  );
}
