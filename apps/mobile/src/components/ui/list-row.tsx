import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Scrolling screen body with the shared padding + background. */
export function Screen({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

/** Rounded card holding rows, with an optional small caption above. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {title && (
        <Text style={{ fontFamily: Figtree.semibold, fontSize: 12, color: theme.textSecondary, paddingHorizontal: 4 }}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

/**
 * One row: title (+ hint) on the left, value / control on the right.
 * Pass `onPress` to make the whole row tappable (≥44px high either way).
 */
export function Row({
  label,
  hint,
  value,
  right,
  onPress,
  destructive,
  last,
}: {
  label: string;
  hint?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();
  const body = (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.backgroundSelected,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: destructive ? theme.error : theme.text }}>
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary }}>{hint}</Text>
        ) : null}
      </View>
      {value ? (
        <Text
          selectable
          numberOfLines={1}
          style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary, maxWidth: '55%' }}
        >
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && !right ? <Text style={{ fontSize: 20, color: theme.textSecondary }}>›</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 44 }}>
      {body}
    </Pressable>
  );
}

/** Short explanation under a group. */
export function Note({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary, paddingHorizontal: 4 }}>
      {text}
    </Text>
  );
}
