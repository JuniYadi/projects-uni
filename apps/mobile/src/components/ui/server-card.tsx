import { Pressable, Text, View } from 'react-native';
import { radius, spacing, typography } from '@univpn/design-tokens';

import { useTheme } from '@/hooks/use-theme';

type ServerCardProps = {
  name: string;
  /** Latency in ms; null while unknown. */
  ping: number | null;
  selected?: boolean;
  onPress: () => void;
};

export function ServerCard({ name, ping, selected = false, onPress }: ServerCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        padding: spacing.three,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.border,
        backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
      })}>
      <View>
        <Text style={{ color: theme.text, fontSize: typography.bodyStrong.size, fontWeight: typography.bodyStrong.weight }}>
          {name}
        </Text>
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: typography.caption.size }}>
        {ping === null ? '—' : `${ping} ms`}
      </Text>
    </Pressable>
  );
}
