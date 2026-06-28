import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';
import { formatBytes, formatDuration, formatPing } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';

function PingBadge({ ping }: { ping: number }) {
  const { label, color } = formatPing(ping);
  return <Text style={[styles.ping, { color }]}>🟢 {label}</Text>;
}

function ProfileCard({ profile, onPress }: { profile: VpnProfile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <View style={styles.cardRow}>
        <Text style={styles.flag}>{profile.countryCode}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={styles.serverName}>{profile.name}</Text>
            <PingBadge ping={profile.ping} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text style={styles.protocol}>{profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}</Text>
            <Text style={styles.detail}>● {profile.port} ● {profile.load}% load</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
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
      style={({ pressed }) => [styles.connectedBanner, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 12 }}>🟢</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.connectedName}>Connected to {profile.name}</Text>
          <Text style={styles.connectedDetail}>
            {formatDuration(conn.elapsed)}  ▼{formatBytes(conn.bytesDownloaded)} ▲{formatBytes(conn.bytesUploaded)}
          </Text>
        </View>
        <Host>
          <Button variant="text" onPress={conn.disconnect}>
            <Text style={{ color: '#fff' }}>Disconnect</Text>
          </Button>
        </Host>
      </View>
    </Pressable>
  );
}

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

  if (loading) return <Text style={styles.centerText}>Loading servers...</Text>;

  if (error) {
    return (
      <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
        <Text style={styles.errorText}>{error}</Text>
        <Host><Button variant="text" onPress={loadProfiles}>Tap to retry</Button></Host>
      </View>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
        <Text>No servers found</Text>
        <Host><Button variant="text" onPress={loadProfiles}>Refresh</Button></Host>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {Object.entries(sections).map(([region, profiles]) => (
        <View key={region} style={{ gap: 8 }}>
          <Text style={styles.sectionHeader}>
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

export default function ServersScreen() {
  const router = useRouter();
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const insets = useSafeAreaInsets();

  useEffect(() => { loadProfiles(); }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.three }]}
    >
      <ConnectedBanner router={router} />
      <ProfileList router={router} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.three, gap: Spacing.three },
  connectedBanner: { backgroundColor: '#34c759', borderRadius: 12, padding: Spacing.three },
  connectedName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  connectedDetail: { color: '#fff', fontSize: 12 },
  card: { backgroundColor: 'rgba(120,120,128,0.08)', borderRadius: 12, padding: Spacing.three },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flag: { fontSize: 24 },
  serverName: { fontWeight: '600', fontSize: 15 },
  ping: { fontSize: 12, fontWeight: '500' },
  protocol: { fontSize: 11, color: '#636366', backgroundColor: 'rgba(120,120,128,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  detail: { fontSize: 11, color: '#636366' },
  chevron: { fontSize: 20, color: '#c7c7cc' },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#636366', marginTop: 8 },
  centerText: { textAlign: 'center', marginTop: 64, color: '#636366' },
  errorText: { color: '#ff3b30' },
});
