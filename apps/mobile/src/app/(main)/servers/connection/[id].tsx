import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, Alert, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { formatBytes, formatDuration } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';

// ─── data-row ──────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center py-3 px-1">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 w-28">{label}</Text>
      <Text className="text-sm flex-1 text-black dark:text-white" selectable>{value}</Text>
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
  const statusEmoji = connected ? '🟢' : connecting ? '🟡' : '🔴';
  const statusLabel = connected ? 'CONNECTED' : connecting ? 'CONNECTING...' : disconnecting ? 'DISCONNECTING...' : 'DISCONNECTED';

  return (
    <View className="items-center py-8 px-6 bg-black/5 dark:bg-white/10 rounded-2xl">
      {/* flag badge */}
      <View className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/15 items-center justify-center mb-4">
        <Text className="text-2xl font-bold text-black dark:text-white">{profile.countryCode}</Text>
      </View>

      {/* name + protocol */}
      <Text className="text-xl font-bold text-black dark:text-white">{profile.name}</Text>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
        {profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}
      </Text>

      {/* divider */}
      <View className="w-12 h-0.5 bg-black/10 dark:bg-white/10 rounded-full my-5" />

      {/* status indicator */}
      <View className="items-center gap-1">
        <Text className="text-2xl">{statusEmoji}</Text>
        <Text className={`text-xs font-semibold tracking-widest ${connected ? 'text-green-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
          {statusLabel}
        </Text>
      </View>

      {/* timer */}
      <Text className="text-4xl font-light text-black dark:text-white mt-3 tabular-nums">
        {formatDuration(isActive ? conn.elapsed : 0)}
      </Text>

      {/* data stats */}
      <View className="flex-row gap-6 mt-4">
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
  const conn = useConnectionStore();
  const connect = useConnectionStore((s) => s.connect);
  const disconnect = useConnectionStore((s) => s.disconnect);
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

  const handleConnect = useCallback(async () => {
    if (profile) await connect(profile);
  }, [profile, connect]);

  const handleDisconnect = useCallback(() => {
    Alert.alert('Disconnect', `Disconnect from ${profile?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => { disconnect(); } },
    ]);
  }, [profile, disconnect]);

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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View className="px-4 pt-4 pb-8 gap-6">
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
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl px-3">
            <InfoRow label="Server" value={profile.serverAddress} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-1" />
            <InfoRow label="IP" value={profile.serverIp} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-1" />
            <InfoRow label="Location" value={`${profile.city}, ${profile.region}`} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-1" />
            <InfoRow label="Protocol" value={`${profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'} UDP ${profile.port}`} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-1" />
            <InfoRow label="Encryption" value={profile.encryption} />
            <View className="h-px bg-black/10 dark:bg-white/10 mx-1" />
            <InfoRow label="Connected" value={connected ? formatDuration(conn.elapsed) : '—'} />
          </View>
        </View>

        {conn.error && (
          <View className="bg-red-500/10 rounded-xl px-4 py-3">
            <Text className="text-red-500 text-sm">{conn.error}</Text>
          </View>
        )}

        {/* action button */}
        <View className="pt-2">
          {connected || disconnecting ? (
            <Host style={{ width: '100%' }}>
              <Button
                variant="filled"
                onPress={handleDisconnect}
                disabled={disconnecting}
                label={disconnecting ? 'Disconnecting...' : 'DISCONNECT'}
              />
            </Host>
          ) : (
            <Host style={{ width: '100%' }}>
              <Button
                variant="filled"
                onPress={handleConnect}
                disabled={connecting}
                label={connecting ? 'Connecting...' : 'Connect'}
              />
            </Host>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
