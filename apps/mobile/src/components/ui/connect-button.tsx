import { Pressable, Text } from 'react-native';
import { radius, spacing, typography } from '@univpn/design-tokens';

import { useTheme } from '@/hooks/use-theme';
import type { ConnectionStatus } from '@/types/vpn';

const LABEL: Record<ConnectionStatus, string> = {
  disconnected: 'Connect',
  connecting: 'Connecting…',
  connected: 'Disconnect',
  disconnecting: 'Disconnecting…',
};

export function ConnectButton({ status, onPress }: { status: ConnectionStatus; onPress: () => void }) {
  const theme = useTheme();
  const busy = status === 'connecting' || status === 'disconnecting';
  const connected = status === 'connected';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.five,
        borderRadius: radius.pill,
        backgroundColor: connected ? theme.backgroundElement : theme.accent,
        borderWidth: connected ? 1 : 0,
        borderColor: theme.border,
        opacity: busy || pressed ? 0.7 : 1,
      })}>
      <Text
        style={{
          color: connected ? theme.text : theme.onAccent,
          fontSize: typography.title.size,
          fontWeight: typography.title.weight,
        }}>
        {LABEL[status]}
      </Text>
    </Pressable>
  );
}
