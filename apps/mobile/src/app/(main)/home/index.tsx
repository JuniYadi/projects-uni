import { useCallback, useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionStatus } from '@/components/connection-status';
import { CountryBadge } from '@/components/ui/country-badge';
import { Figtree } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { useTheme } from '@/hooks/use-theme';
import { useConnectionStore } from '@/stores/connectionStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { toUiStatus } from '@/utils/connection-ui';

const TUNNEL_CHECK_MS = 5000;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { status: connStatus, error, dropped, profile, connect: connectTo, disconnect, checkTunnel, releaseKillSwitch } =
    useConnectionStore();
  const { profiles, filteredProfiles, selectedProfileId, loadProfiles } = useProfileStore();
  const killSwitch = useSettingsStore((s) => s.killSwitch);

  const status = toUiStatus({ status: connStatus, error, dropped });

  useEffect(() => {
    if (profiles.length === 0) loadProfiles();
  }, [profiles.length, loadProfiles]);

  // Detect a lost tunnel while connected.
  useEffect(() => {
    if (connStatus !== 'connected') return;
    const id = setInterval(checkTunnel, TUNNEL_CHECK_MS);
    return () => clearInterval(id);
  }, [connStatus, checkTunnel]);

  // Connected/connecting/failed/dropped keep their profile; idle uses the picked location (WireGuard only).
  const location =
    profile ??
    profiles.find((p) => p.id === selectedProfileId && p.protocol === 'wireguard') ??
    filteredProfiles.find((p) => p.protocol === 'wireguard') ??
    profiles.find((p) => p.protocol === 'wireguard') ??
    null;

  const connect = useCallback(() => location && connectTo(location), [location, connectTo]);
  const onPress = status === 'connected' ? disconnect : connect;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: insets.top,
        paddingBottom: 16,
      }}
    >
      {/* maxWidth keeps tablet / wide windows readable; size shrinks on small phones */}
      <View style={{ width: '100%', maxWidth: 480, alignItems: 'center', gap: 24 }}>
        <ConnectionStatus
          status={status}
          size={height < 640 ? 96 : 128}
          disabled={status === 'idle' && !location}
          onPress={onPress}
          onCancel={disconnect}
          onRetry={connect}
          onReconnect={connect}
          onDisconnect={disconnect}
          onUseWithoutVpn={killSwitch ? releaseKillSwitch : undefined}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={Strings.home.changeLocation}
          onPress={() => router.push('/(main)/locations')}
          style={{
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: theme.backgroundElement,
          }}
        >
          {location && <CountryBadge code={location.countryCode} />}
          <Text style={{ fontFamily: Figtree.medium, fontSize: 15, color: theme.text }}>
            {location?.name ?? Strings.home.noLocation}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
