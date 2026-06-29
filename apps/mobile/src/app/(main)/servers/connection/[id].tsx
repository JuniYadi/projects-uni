import { useEffect, useRef } from 'react';
import { ScrollView, View, Text, Animated, useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Host, Button } from '@expo/ui';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { formatBytes, formatDuration, countryFlag } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';
import { Colors } from '@/constants/theme';

// ponytail: gradient-like bg glow — overlapping views, no dep
function BgGlow() {
  const scheme = useColorScheme();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: -120,
          alignSelf: 'center',
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#00C781',
          opacity: scheme === 'dark' ? 0.08 : 0.05,
        }}
      />
    </View>
  );
}

function StatusBolt({ color, size = 30 }: { color: string; size?: number }) {
  return (
    <SymbolView
      name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
      tintColor={color}
      size={size}
      style={{ width: size, height: size }}
    />
  );
}

// ─── data-row ──────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center py-3 px-4">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 w-28">{label}</Text>
      <Text className="text-sm flex-1 text-black dark:text-white font-medium" selectable>{value}</Text>
    </View>
  );
}

// ─── status card ───────────────────────────────────────────

function StatusCard({
  profile,
  connected,
  connecting,
  disconnecting,
  conn,
  isActive,
}: {
  profile: VpnProfile;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  conn: { elapsed: number; bytesDownloaded: number; bytesUploaded: number };
  isActive: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const statusColor = connected ? '#34c759' : connecting ? '#ff9f0a' : '#8e8e93';
  const statusLabel = connected ? 'CONNECTED' : connecting ? 'CONNECTING...' : disconnecting ? 'DISCONNECTING...' : 'DISCONNECTED';
  const boltScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!connecting) {
      boltScale.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(boltScale, { toValue: 1.15, duration: 450, useNativeDriver: true }),
        Animated.timing(boltScale, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [connecting, boltScale]);

  return (
    <View className="items-center py-8 px-6 rounded-2xl overflow-hidden"
      style={{ backgroundColor: connected ? '#00C78110' : colors.backgroundElement }}
    >
      {/* accent bar when connected */}
      {connected && (
        <View className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#00C781' }} />
      )}

      {/* flag badge */}
      <View className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
        style={{ backgroundColor: connected ? '#00C78120' : '#00000010' }}
      >
        <Text className="text-4xl">{countryFlag(profile.countryCode)}</Text>
      </View>

      {/* name + protocol */}
      <Text className="text-xl font-bold text-black dark:text-white">{profile.name}</Text>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
        {profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}  ●  {profile.port}
      </Text>

      {/* divider */}
      <View className="w-12 h-0.5 rounded-full my-5" style={{ backgroundColor: colors.backgroundSelected }} />

      {/* status indicator */}
      <View className="items-center gap-2">
        <View className="items-center justify-center" style={{ width: 32, height: 32 }}>
          {connecting ? (
            <Animated.View style={{ transform: [{ scale: boltScale }] }}>
              <StatusBolt color="#ffcc00" />
            </Animated.View>
          ) : (
            <StatusBolt color={connected ? '#ffcc00' : statusColor} />
          )}
        </View>
        <Text className="text-xs font-semibold tracking-widest" style={{ color: statusColor }}>
          {statusLabel}
        </Text>
      </View>

      {/* timer */}
      <Text className="text-5xl font-light text-black dark:text-white mt-5 tabular-nums tracking-wider">
        {formatDuration(isActive ? conn.elapsed : 0)}
      </Text>

      {/* data stats */}
      <View className="flex-row gap-8 mt-5">
        <View className="items-center">
          <Text className="text-base font-semibold text-black dark:text-white">▼ {formatBytes(isActive ? conn.bytesDownloaded : 0)}</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Download</Text>
        </View>
        <View className="items-center">
          <Text className="text-base font-semibold text-black dark:text-white">▲ {formatBytes(isActive ? conn.bytesUploaded : 0)}</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Upload</Text>
        </View>
      </View>
    </View>
  );
}

// ─── screen ────────────────────────────────────────────────

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfileStore((s) => s.profiles.find((p) => p.id === id));
  const status = useConnectionStore((s) => s.status);
  const connectionProfile = useConnectionStore((s) => s.profile);
  const elapsed = useConnectionStore((s) => s.elapsed);
  const bytesDownloaded = useConnectionStore((s) => s.bytesDownloaded);
  const bytesUploaded = useConnectionStore((s) => s.bytesUploaded);
  const tunnelAddress = useConnectionStore((s) => s.tunnelAddress);
  const tunnelDns = useConnectionStore((s) => s.tunnelDns);
  const connError = useConnectionStore((s) => s.error);
  const connect = useConnectionStore((s) => s.connect);
  const disconnect = useConnectionStore((s) => s.disconnect);

  const conn = { status, profile: connectionProfile, elapsed, bytesDownloaded, bytesUploaded, tunnelAddress, tunnelDns, error: connError };
  const tick = useConnectionStore((s) => s.tick);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (conn.status === 'connected' && !intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    }
    if (conn.status === 'disconnected' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [conn.status, tick]);

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-neutral-400">Server not found</Text>
      </View>
    );
  }

  const isActive = conn.profile?.id === id;
  const connected = isActive && conn.status === 'connected';
  const connecting = isActive && conn.status === 'connecting';
  const disconnecting = isActive && conn.status === 'disconnecting';

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <BgGlow />
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1">
      <View className="px-4 pt-4 gap-6" style={{ paddingBottom: insets.bottom + 20 }}>
        {/* status card */}
        <StatusCard
          profile={profile}
          connected={connected}
          connecting={connecting}
          disconnecting={disconnecting}
          conn={conn}
          isActive={isActive}
        />

        {/* server info */}
        <View className="gap-2">
          <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase px-1">
            Server Information
          </Text>
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl">
            <InfoRow label="Server" value={profile.serverAddress} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />
            <InfoRow label="IP Server" value={profile.serverIp} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />
            <InfoRow label="IP Lokal" value={conn.tunnelAddress.join(', ') || 'Connect untuk lihat IP'} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />
            <InfoRow label="DNS" value={conn.tunnelDns.join(', ') || 'Connect untuk lihat DNS'} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />
            <InfoRow label="Encryption" value={profile.encryption} />
          </View>
        </View>

        {/* error */}
        {conn.error && (
          <View className="bg-red-500/10 rounded-xl px-4 py-3">
            <Text className="text-red-500 text-sm">{conn.error}</Text>
          </View>
        )}

        {/* connect / disconnect button */}
        <Host style={{ width: '100%', minHeight: 48 }}>
          <Button
            variant="filled"
            onPress={() => {
              if (connected) {
                disconnect();
              } else if (!connecting && !disconnecting) {
                connect(profile);
              }
            }}
            disabled={connecting || disconnecting}
            label={
              connecting
                ? 'Connecting...'
                : disconnecting
                  ? 'Disconnecting...'
                  : connected
                    ? 'Disconnect'
                    : 'Connect'
            }
          />
        </Host>
      </View>
    </ScrollView>
    </View>
  );
}
