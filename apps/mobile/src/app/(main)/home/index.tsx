import { useCallback, useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionStatus } from '@/components/connection-status';
import { CountryBadge } from '@/components/ui/country-badge';
import { Icon } from '@/components/ui/icon';
import { Figtree } from '@/constants/theme';
import { Strings, latencyCategory, latencyLabel } from '@/constants/strings';
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
        paddingTop: insets.top,
      }}
    >
      {/* Top Header */}
      <View
        style={{
          height: 52,
          paddingHorizontal: 20,
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.text }}>
          {Strings.app.name}
        </Text>
      </View>

      {/* Main Content Area */}
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        {/* Center: Connect button + status text */}
        <View style={{ flex: 1, justifyContent: 'center', width: '100%', maxWidth: 440 }}>
          <ConnectionStatus
            status={status}
            size={height < 640 ? 104 : 128}
            disabled={status === 'idle' && !location}
            onPress={onPress}
            onCancel={disconnect}
            onRetry={connect}
            onReconnect={connect}
            onDisconnect={disconnect}
            onUseWithoutVpn={killSwitch ? releaseKillSwitch : undefined}
          />
        </View>

        {/* Bottom Slot: Location card in idle or connected */}
        {(status === 'idle' || status === 'connected') && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={Strings.home.changeLocation}
            onPress={() => router.push('/(main)/locations')}
            style={{
              width: '100%',
              maxWidth: 440,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: theme.backgroundElement,
              borderWidth: 1,
              borderColor: theme.backgroundSelected,
            }}
          >
            {location ? (
              <CountryBadge code={location.countryCode} />
            ) : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.backgroundSelected,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="locations" size={18} color={theme.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {location ? (
                <>
                  <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>
                    {location.name}
                  </Text>
                  <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    {location.city && location.city !== location.name ? `${location.city} · ` : ''}
                    <Text
                      style={{
                        color:
                          latencyCategory(location.ping) === 'fast'
                            ? theme.accent
                            : latencyCategory(location.ping) === 'normal'
                              ? '#F59E0B'
                              : theme.textSecondary,
                        fontFamily: Figtree.medium,
                      }}
                    >
                      {latencyLabel(location.ping)}
                    </Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary }}>
                    {Strings.tabs.locations}
                  </Text>
                  <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>
                    {Strings.home.noLocation}
                  </Text>
                </>
              )}
            </View>
            <Icon name="chevron-right" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
