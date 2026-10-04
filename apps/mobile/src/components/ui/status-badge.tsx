import { Text, View } from 'react-native';
import { radius, spacing, statusColor, typography } from '@univpn/design-tokens';

import { useTheme } from '@/hooks/use-theme';
import type { ConnectionStatus } from '@/types/vpn';

const LABEL: Record<ConnectionStatus, string> = {
  disconnected: 'Not connected',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnecting: 'Disconnecting…',
};

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const theme = useTheme();
  const color = theme[statusColor[status]];

  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.two,
        paddingHorizontal: spacing.three,
        paddingVertical: spacing.one,
        borderRadius: radius.pill,
        backgroundColor: theme.backgroundElement,
      }}>
      <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: color }} />
      <Text style={{ color, fontSize: typography.caption.size, fontWeight: typography.caption.weight }}>
        {LABEL[status]}
      </Text>
    </View>
  );
}
