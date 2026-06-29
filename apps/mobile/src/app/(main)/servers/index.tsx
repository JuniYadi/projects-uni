import { useEffect, useMemo, useCallback, useState } from 'react';
import { ScrollView, Pressable, View, Text, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { formatBytes, formatDuration, formatPing } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';

// ─── helpers ───────────────────────────────────────────────

const LOAD_COLORS = {
  low: '#34c759',
  med: '#ff9f0a',
  high: '#ff453a',
} as const;

function loadColor(pct: number): string {
  if (pct < 50) return LOAD_COLORS.low;
  if (pct < 80) return LOAD_COLORS.med;
  return LOAD_COLORS.high;
}

// ─── sub-components ────────────────────────────────────────

function PingBadge({ ping }: { ping: number }) {
  const { label, color } = formatPing(ping);
  return (
    <View className="flex-row items-center gap-1">
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-medium" style={{ color }}>{label}</Text>
    </View>
  );
}

function ProfileCard({ profile, onPress }: { profile: VpnProfile; onPress: () => void }) {
  const conn = useConnectionStore();

  const handleLongPress = useCallback(() => {
    Alert.alert(profile.name, undefined, [
      {
        text: 'Connect',
        onPress: () => conn.connect(profile),
      },
      {
        text: 'Copy Config',
        onPress: () => {
          // ponytail: add expo-clipboard when copy-to-clipboard is a real UX need
          console.warn('Copy config:', profile.serverAddress);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [profile, conn]);

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress}>
      {({ pressed }) => (
        <View
          className={`flex-row items-center rounded-2xl px-4 py-4 ${
            pressed
              ? 'bg-black/10 dark:bg-white/15'
              : 'bg-black/5 dark:bg-white/10'
          }`}
        >
          {/* flag badge */}
          <View className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/15 items-center justify-center mr-3">
            <Text className="text-lg font-semibold text-black dark:text-white">{profile.countryCode}</Text>
          </View>

          {/* info */}
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-base text-black dark:text-white" numberOfLines={1}>
                {profile.name}
              </Text>
              <PingBadge ping={profile.ping} />
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-medium bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-neutral-500 dark:text-neutral-400 overflow-hidden">
                {profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}
              </Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                ● {profile.port}
              </Text>
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: loadColor(profile.load) }} />
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">{profile.load}%</Text>
              </View>
            </View>
          </View>

          {/* chevron */}
          <Text className="text-lg text-neutral-300 dark:text-neutral-600 ml-2">›</Text>
        </View>
      )}
    </Pressable>
  );
}

function ConnectedBanner({ router }: { router: ReturnType<typeof useRouter> }) {
  const conn = useConnectionStore();
  const profile = conn.profile;
  if (!profile || conn.status !== 'connected') return null;

  return (
    <Pressable
      onPress={() => router.push(`/servers/connection/${profile.id}`)}
      className="active:opacity-70"
    >
      <View className="flex-row items-center gap-3 bg-green-500 rounded-2xl px-4 py-4">
        <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
          <Text className="text-lg">🟢</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-white font-semibold text-sm">Connected to {profile.name}</Text>
          <Text className="text-white/80 text-xs">
            {formatDuration(conn.elapsed)}  ▼{formatBytes(conn.bytesDownloaded)} ▲{formatBytes(conn.bytesUploaded)}
          </Text>
        </View>
        <Host style={{ minHeight: 36 }}>
          <Button variant="text" onPress={conn.disconnect} label="Disconnect" />
        </Host>
      </View>
    </Pressable>
  );
}

// ─── main list ─────────────────────────────────────────────

function ProfileList({ router }: { router: ReturnType<typeof useRouter> }) {
  const { filteredProfiles, loading, error, loadProfiles } = useProfileStore();

  const sections = useMemo(() => {
    if (filteredProfiles.length === 0) return {};
    const sorted = [...filteredProfiles].sort((a, b) => a.ping - b.ping);
    const recId = sorted[0].id;
    const groups: Record<string, VpnProfile[]> = {};
    for (const p of filteredProfiles) {
      const key = p.id === recId ? '__rec' : p.region;
      (groups[key] ??= []).push(p);
    }
    return groups;
  }, [filteredProfiles]);

  if (loading) return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-neutral-400 dark:text-neutral-500">Loading servers...</Text>
    </View>
  );

  if (error) {
    return (
      <View className="items-center gap-3 py-20">
        <Text className="text-red-500 text-sm">{error}</Text>
        <Host><Button variant="text" onPress={loadProfiles} label="Tap to retry" /></Host>
      </View>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <View className="items-center gap-3 py-20">
        <Text className="text-neutral-400 dark:text-neutral-500">No servers found</Text>
        <Host><Button variant="text" onPress={loadProfiles} label="Refresh" /></Host>
      </View>
    );
  }

  return (
    <View className="gap-6">
      {Object.entries(sections).map(([region, profiles]) => (
        <View key={region} className="gap-3">
          <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase px-1">
            {region === '__rec' ? 'RECOMMENDED' : region}
          </Text>
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onPress={() => router.push(`/servers/connection/${p.id}`)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── screen ────────────────────────────────────────────────

export default function ServersScreen() {
  const router = useRouter();
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  }, [loadProfiles]);

  // ponytail: no padding on top — the Stack header handles that via contentInsetAdjustmentBehavior
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="gap-4 pt-2">
        <ConnectedBanner router={router} />
        <ProfileList router={router} />
      </View>
    </ScrollView>
  );
}
