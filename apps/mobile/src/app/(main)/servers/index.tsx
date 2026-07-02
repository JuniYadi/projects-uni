import { useEffect, useMemo, useCallback, useState } from 'react';
import { ScrollView, Pressable, View, Text, RefreshControl, Alert, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { formatBytes, formatDuration, formatPing, countryFlag } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';
import { Colors } from '@/constants/theme';

function useAccent() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark.accent : Colors.light.accent;
}

function useFill() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark.backgroundElement : Colors.light.backgroundElement;
}

function PingBadge({ ping }: { ping: number | null }) {
  const { label, color } = formatPing(ping);
  return (
    <View className="flex-row items-center gap-1.5 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-semibold" style={{ color }}>{label}</Text>
    </View>
  );
}

function ProfileCard({ profile, onPress }: { profile: VpnProfile; onPress: () => void }) {
  const activeId = useConnectionStore((s) => s.profile?.id);
  const connect = useConnectionStore((s) => s.connect);
  const setSelectedProfileId = useProfileStore((s) => s.setSelectedProfileId);
  const isActive = activeId === profile.id;
  const accent = useAccent();
  const fill = useFill();

  const handleLongPress = useCallback(() => {
    Alert.alert(profile.name, undefined, [
      {
        text: 'Connect',
        onPress: async () => {
          await setSelectedProfileId(profile.id);
          connect(profile);
        },
      },
      {
        text: 'Copy Config',
        onPress: () => {
          console.warn('Copy config:', profile.serverAddress);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [profile, connect, setSelectedProfileId]);

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress}>
      {({ pressed }) => (
        <View
          className="flex-row items-center px-4 py-3.5"
          style={{ opacity: pressed ? 0.6 : 1 }}
        >
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: fill }}
          >
            <Text className="text-xl">{countryFlag(profile.countryCode)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-base text-black dark:text-white" numberOfLines={1}>
                {profile.name}
              </Text>
              {isActive && (
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              )}
            </View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
              {profile.serverIp}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 ml-2">
            <PingBadge ping={profile.ping} />
            <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function ConnectedBanner({ router }: { router: ReturnType<typeof useRouter> }) {
  const profile = useConnectionStore((s) => s.profile);
  const status = useConnectionStore((s) => s.status);
  const elapsed = useConnectionStore((s) => s.elapsed);
  const bytesDownloaded = useConnectionStore((s) => s.bytesDownloaded);
  const bytesUploaded = useConnectionStore((s) => s.bytesUploaded);
  const tunnelAddress = useConnectionStore((s) => s.tunnelAddress);
  const disconnect = useConnectionStore((s) => s.disconnect);
  const accent = useAccent();
  if (!profile || status !== 'connected') return null;

  return (
    <Pressable
      onPress={() => router.push(`/servers/connection/${profile.id}`)}
      className="rounded-2xl overflow-hidden active:opacity-90"
    >
      <View className="flex-row items-center gap-3 px-4 py-4" style={{ backgroundColor: accent }}>
        <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
          <Text className="text-lg">{countryFlag(profile.countryCode)}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-white font-semibold text-sm">Connected to {profile.name}</Text>
          <Text className="text-white/80 text-xs">
            {tunnelAddress[0] ? `IP Lokal ${tunnelAddress[0]}  ` : ''}{formatDuration(elapsed)}  ▼{formatBytes(bytesDownloaded)} ▲{formatBytes(bytesUploaded)}
          </Text>
        </View>
        <Host style={{ minHeight: 36 }}>
          <Button variant="text" onPress={disconnect} label="Disconnect" />
        </Host>
      </View>
    </Pressable>
  );
}

function SectionHeader({ title, isRecommended }: { title: string; isRecommended?: boolean }) {
  const accent = useAccent();
  return (
    <View className="flex-row items-center gap-2 px-1 pb-1.5 pt-6">
      {isRecommended && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />}
      <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">
        {title}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />;
}

function ProfileList({ router }: { router: ReturnType<typeof useRouter> }) {
  const { filteredProfiles, loading, error, pinging, activeFilter, loadProfiles, setSelectedProfileId } = useProfileStore();

  const sections = useMemo(() => {
    if (filteredProfiles.length === 0) return [];
    const sorted = [...filteredProfiles].sort((a, b) => (a.ping ?? Infinity) - (b.ping ?? Infinity));
    const recId = sorted[0]?.id;
    const groups: Record<string, VpnProfile[]> = {};
    for (const p of filteredProfiles) {
      const key = p.id === recId ? '__rec' : p.region;
      (groups[key] ??= []).push(p);
    }
    const entries = Object.entries(groups);
    const recIndex = entries.findIndex(([k]) => k === '__rec');
    if (recIndex > 0) {
      const [rec] = entries.splice(recIndex, 1);
      entries.unshift(rec);
    }
    return entries;
  }, [filteredProfiles]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilter.protocol !== 'wireguard') count++;
    if (activeFilter.region !== 'all') count++;
    if (activeFilter.status !== 'all') count++;
    if (activeFilter.sortBy !== 'ping') count++;
    return count;
  }, [activeFilter]);

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
        {activeFilterCount > 0 && (
          <Text className="text-neutral-500 dark:text-neutral-600 text-xs text-center px-8">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active. Tap reset to see all servers.
          </Text>
        )}
        <Host><Button variant="text" onPress={loadProfiles} label="Refresh" /></Host>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {pinging && (
        <View className="flex-row items-center gap-2 px-1">
          <View className="w-2 h-2 rounded-full bg-[#007AFF]" />
          <Text className="text-xs font-semibold text-[#007AFF] tracking-wider">Measuring ping…</Text>
        </View>
      )}
      {sections.map(([region, profiles]) => (
        <View key={region}>
          <SectionHeader
            title={region === '__rec' ? 'Recommended' : region}
            isRecommended={region === '__rec'}
          />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            {profiles.map((p, index) => (
              <View key={p.id}>
                <ProfileCard
                  profile={p}
                  onPress={() => {
                    setSelectedProfileId(p.id);
                    router.push(`/servers/connection/${p.id}`);
                  }}
                />
                {index < profiles.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ServersScreen() {
  const router = useRouter();
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const cancelLoadProfiles = useProfileStore((s) => s.cancelLoadProfiles);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfiles();
    return cancelLoadProfiles;
  }, [loadProfiles, cancelLoadProfiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  }, [loadProfiles]);

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-4 pt-2">
          <ConnectedBanner router={router} />
          <ProfileList router={router} />
        </View>
      </ScrollView>
    </View>
  );
}
