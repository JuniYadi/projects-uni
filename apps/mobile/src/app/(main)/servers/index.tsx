import { useEffect, useMemo, useCallback, useState } from 'react';
import { ScrollView, Pressable, View, Text, RefreshControl, Alert, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { formatBytes, formatDuration, formatPing, countryFlag } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';
import { Colors } from '@/constants/theme';

// ponytail: gradient-like background using overlapping circles — no linear-gradient dep
function BgGlow() {
  const scheme = useColorScheme();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: -140,
          alignSelf: 'center',
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: '#00C781',
          opacity: scheme === 'dark' ? 0.06 : 0.04,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -80,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#007AFF',
          opacity: scheme === 'dark' ? 0.04 : 0.03,
        }}
      />
    </View>
  );
}

// ─── helpers ───────────────────────────────────────────────

const LOAD_COLORS = { low: '#34c759', med: '#ff9f0a', high: '#ff453a' } as const;
function loadColor(pct: number) {
  if (pct < 50) return LOAD_COLORS.low;
  if (pct < 80) return LOAD_COLORS.med;
  return LOAD_COLORS.high;
}

function useAccent() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark.accent : Colors.light.accent;
}

// ─── sub-components ────────────────────────────────────────

function PingBadge({ ping }: { ping: number }) {
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
  const isActive = activeId === profile.id;
  const accent = useAccent();

  const handleLongPress = useCallback(() => {
    Alert.alert(profile.name, undefined, [
      { text: 'Connect', onPress: () => connect(profile) },
      {
        text: 'Copy Config',
        onPress: () => {
          console.warn('Copy config:', profile.serverAddress);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [profile, connect]);

  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress}>
      {({ pressed }) => (
        <View
          className={`rounded-2xl overflow-hidden ${
            isActive ? 'border-l-4' : ''
          }`}
          style={{
            borderLeftColor: isActive ? accent : undefined,
            backgroundColor: pressed
              ? '#00000015'
              : isActive
                ? '#00C78110'
                : undefined,
          }}
        >
          <View
            className={`bg-black/5 dark:bg-white/10 py-4 ${
              isActive ? '' : 'rounded-2xl'
            } ${isActive ? 'rounded-r-2xl' : ''}`}
            style={pressed ? { opacity: 0.7 } : undefined}
          >
            <View className="flex-row items-center px-4">
              {/* flag */}
              <View className="w-12 h-12 rounded-xl bg-white/60 dark:bg-black/30 items-center justify-center mr-3 shadow-sm">
                <Text className="text-2xl">{countryFlag(profile.countryCode)}</Text>
              </View>

              {/* info */}
              <View className="flex-1 gap-1.5">
                <View className="flex-row items-center gap-2">
                  {isActive && (
                    <View className="w-2 h-2 rounded-full bg-[#00C781]" />
                  )}
                  <Text className="font-semibold text-base text-black dark:text-white" numberOfLines={1}>
                    {profile.name}
                  </Text>
                  <PingBadge ping={profile.ping} />
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-semibold bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-neutral-500 dark:text-neutral-400 overflow-hidden">
                    {profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}
                  </Text>
                  <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                    ● {profile.port}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: loadColor(profile.load) }} />
                    <Text className="text-xs text-neutral-400 dark:text-neutral-500">{profile.load}% load</Text>
                  </View>
                </View>
              </View>

              {/* chevron */}
              <Text className="text-lg text-neutral-300 dark:text-neutral-600 ml-2">›</Text>
            </View>
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
  if (!profile || status !== 'connected') return null;

  return (
    <Pressable
      onPress={() => router.push(`/servers/connection/${profile.id}`)}
      className="active:opacity-70 rounded-2xl overflow-hidden"
    >
      <View className="flex-row items-center gap-3 px-4 py-4" style={{ backgroundColor: '#00C781' }}>
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

// ─── pulse dot ─────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const opacity = useState(() => new Animated.Value(0.4))[0];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity }} />
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
          {/* section header with accent for recommended */}
          <View className="flex-row items-center gap-2 px-1">
            {region === '__rec' && <PulseDot color="#00C781" />}
            <Text className={`text-xs font-semibold tracking-widest uppercase ${
              region === '__rec' ? 'text-[#00C781]' : 'text-neutral-400 dark:text-neutral-500'
            }`}>
              {region === '__rec' ? 'BEST PING' : region}
            </Text>
          </View>
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  }, [loadProfiles]);

  return (
    <View style={{ flex: 1 }}>
      <BgGlow />
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
