import { useEffect, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Column, Row, Text, Button } from '@expo/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';
import { formatBytes, formatDuration, formatPing } from '@/utils/formatters';
import type { VpnProfile } from '@/types/vpn';

function PingBadge({ ping }: { ping: number }) {
  const { label, color } = formatPing(ping);
  return <Text textStyle={{ fontSize: 12, fontWeight: '500', color }}>🟢 {label}</Text>;
}

function ProtocolBadge({ protocol }: { protocol: string }) {
  return (
    <Text textStyle={{ fontSize: 11, color: '#636366' }}>
      {protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}
    </Text>
  );
}

function ProfileCard({ profile, onPress }: { profile: VpnProfile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <Row spacing={12} alignment="center">
        <Text textStyle={{ fontSize: 24 }}>{profile.countryCode}</Text>
        <Column spacing={4} style={{ flex: 1 }}>
          <Row spacing={8} alignment="center">
            <Text textStyle={{ fontSize: 15, fontWeight: '600' }}>{profile.name}</Text>
            <PingBadge ping={profile.ping} />
          </Row>
          <Row spacing={8} alignment="center">
            <ProtocolBadge protocol={profile.protocol} />
            <Text textStyle={{ fontSize: 11, color: '#636366' }}>
              ● {profile.port} ● {profile.load}% load
            </Text>
          </Row>
        </Column>
        <Text textStyle={{ fontSize: 20, color: '#c7c7cc' }}>›</Text>
      </Row>
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
      <Row spacing={12} alignment="center">
        <Text textStyle={{ fontSize: 12 }}>🟢</Text>
        <Column spacing={2} style={{ flex: 1 }}>
          <Text textStyle={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
            Connected to {profile.name}
          </Text>
          <Text textStyle={{ fontSize: 12, color: '#fff' }}>
            {formatDuration(conn.elapsed)}  ▼{formatBytes(conn.bytesDownloaded)} ▲{formatBytes(conn.bytesUploaded)}
          </Text>
        </Column>
        <Button variant="text" onPress={conn.disconnect}>
          <Text textStyle={{ color: '#fff' }}>Disconnect</Text>
        </Button>
      </Row>
    </Pressable>
  );
}

function ProfileList({ router }: { router: ReturnType<typeof useRouter> }) {
  const { filteredProfiles, loading, error, loadProfiles } = useProfileStore();

  const sections = useMemo(() => {
    if (filteredProfiles.length === 0) return {};
    const sorted = [...filteredProfiles].sort((a, b) => a.ping - b.ping);
    const recommendedId = sorted[0].id;
    const groups: Record<string, VpnProfile[]> = {};
    for (const p of filteredProfiles) {
      const key = p.id === recommendedId ? '__recommended' : p.region;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [filteredProfiles]);

  if (loading) {
    return <Text textStyle={{ textAlign: 'center', marginTop: 64, color: '#636366' }}>Loading servers...</Text>;
  }
  if (error) {
    return (
      <Column spacing={8} style={{ alignItems: 'center', padding: 24 }}>
        <Text textStyle={{ color: '#ff3b30' }}>{error}</Text>
        <Button variant="text" onPress={loadProfiles}>Tap to retry</Button>
      </Column>
    );
  }
  if (filteredProfiles.length === 0) {
    return (
      <Column spacing={8} style={{ alignItems: 'center', padding: 24 }}>
        <Text>No servers found</Text>
        <Button variant="text" onPress={loadProfiles}>Refresh</Button>
      </Column>
    );
  }

  return (
    <>
      {Object.entries(sections).map(([region, profiles]) => (
        <Column key={region} spacing={8}>
          <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366', marginTop: 8 }}>
            {region === '__recommended' ? 'RECOMMENDED' : region}
          </Text>
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onPress={() => router.push(`/servers/connection/${p.id}`)}
            />
          ))}
        </Column>
      ))}
    </>
  );
}

export default function ServersScreen() {
  const router = useRouter();
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const insets = useSafeAreaInsets();

  useEffect(() => { loadProfiles(); }, []);

  return (
    <Host style={{ width: '100%', height: '100%' }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.three }]}
      >
        <ConnectedBanner router={router} />
        <ProfileList router={router} />
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.three, gap: Spacing.three },
  connectedBanner: {
    backgroundColor: '#34c759',
    borderRadius: 12,
    padding: Spacing.three,
  },
  card: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 12,
    padding: Spacing.three,
  },
});
