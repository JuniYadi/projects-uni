import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, Alert, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';
import { formatBytes, formatDuration } from '@/utils/formatters';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} selectable>{value}</Text>
    </View>
  );
}

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Server not found</Text>
      </View>
    );
  }

  const isActive = conn.profile?.id === id;
  const connected = isActive && conn.status === 'connected';
  const connecting = isActive && conn.status === 'connecting';
  const disconnecting = isActive && conn.status === 'disconnecting';
  const statusEmoji = connected ? '🟢' : connecting ? '🟡' : '🔴';
  const statusLabel = connected ? 'CONNECTED' : connecting ? 'CONNECTING...' : disconnecting ? 'DISCONNECTING...' : 'DISCONNECTED';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={styles.container}>
        {/* Status Card */}
        <View style={[styles.card, styles.statusCard]}>
          <Text style={styles.flag}>{profile.countryCode}</Text>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.protocol}>{profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}</Text>

          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontSize: 36 }}>{statusEmoji}</Text>
            <Text style={[styles.statusText, connected && { color: '#34c759' }]}>{statusLabel}</Text>
          </View>

          <Text style={styles.timer}>{formatDuration(isActive ? conn.elapsed : 0)}</Text>

          <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.dataValue}>▼ {formatBytes(isActive ? conn.bytesDownloaded : 0)}</Text>
              <Text style={styles.dataLabel}>Download</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.dataValue}>▲ {formatBytes(isActive ? conn.bytesUploaded : 0)}</Text>
              <Text style={styles.dataLabel}>Upload</Text>
            </View>
          </View>
        </View>

        {/* Server Info */}
        <View style={{ width: '100%', gap: 8 }}>
          <Text style={styles.sectionTitle}>Server Information</Text>
          <View style={[styles.card, { padding: 12 }]}>
            <InfoRow label="Server" value={profile.serverAddress} />
            <InfoRow label="IP" value={profile.serverIp} />
            <InfoRow label="Location" value={`${profile.city}, ${profile.region}`} />
            <InfoRow label="Protocol" value={`${profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'} UDP ${profile.port}`} />
            <InfoRow label="Encryption" value={profile.encryption} />
            <InfoRow label="Connected" value={connected ? formatDuration(conn.elapsed) : '—'} />
          </View>
        </View>

        {conn.error && <Text style={styles.error}>{conn.error}</Text>}

        {/* Action */}
        {connected || disconnecting ? (
          <Host style={{ width: '100%' }}>
            <Button
              variant="text"
              onPress={handleDisconnect}
              disabled={disconnecting}
              style={{ width: '100%', backgroundColor: '#ff3b30', borderRadius: 12, paddingVertical: 14 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
                {disconnecting ? 'Disconnecting...' : 'DISCONNECT'}
              </Text>
            </Button>
          </Host>
        ) : (
          <Host style={{ width: '100%' }}>
            <Button
              variant="filled"
              onPress={handleConnect}
              disabled={connecting}
              style={{ width: '100%', paddingVertical: 14 }}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </Host>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four, alignItems: 'center' },
  card: { backgroundColor: 'rgba(120,120,128,0.08)', borderRadius: 16 },
  statusCard: { width: '100%', alignItems: 'center', padding: Spacing.five },
  flag: { fontSize: 48 },
  name: { fontSize: 22, fontWeight: '700' },
  protocol: { fontSize: 14, color: '#636366' },
  statusText: { fontSize: 14, fontWeight: '600', color: '#8e8e93' },
  timer: { fontSize: 36, fontWeight: '300', marginTop: 4 },
  dataValue: { fontSize: 16, fontWeight: '600' },
  dataLabel: { fontSize: 12, color: '#636366' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#636366' },
  infoLabel: { fontSize: 13, color: '#636366', width: 100 },
  infoValue: { fontSize: 13, flex: 1 },
  error: { color: '#ff3b30', fontSize: 13 },
});
