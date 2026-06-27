import { useEffect, useRef, useCallback } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Host, Column, Row, Text, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';
import { formatBytes, formatDuration } from '@/utils/formatters';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row spacing={8}>
      <Text textStyle={{ fontSize: 13, color: '#636366', width: 100 }}>{label}</Text>
      <Text textStyle={{ fontSize: 13, flex: 1 }} selectable>{value}</Text>
    </Row>
  );
}

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
      <Host style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Server not found</Text>
      </Host>
    );
  }

  const isActive = conn.profile?.id === id;
  const isThisConnected = isActive && conn.status === 'connected';
  const isThisConnecting = isActive && conn.status === 'connecting';
  const isThisDisconnecting = isActive && conn.status === 'disconnecting';

  const statusEmoji = isThisConnected ? '🟢' : isThisConnecting ? '🟡' : '🔴';
  const statusLabel = isThisConnected ? 'CONNECTED' : isThisConnecting ? 'CONNECTING...' : isThisDisconnecting ? 'DISCONNECTING...' : 'DISCONNECTED';

  return (
    <Host style={{ width: '100%', height: '100%' }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Column spacing={Spacing.four} style={{ padding: Spacing.four, alignItems: 'center' }}>
          {/* Status Card */}
          <Column spacing={8} style={[styles.card, { alignItems: 'center', alignSelf: 'stretch' }]}>
            <Text textStyle={{ fontSize: 48 }}>{profile.countryCode}</Text>
            <Text textStyle={{ fontSize: 22, fontWeight: '700' }}>{profile.name}</Text>
            <Text textStyle={{ fontSize: 14, color: '#636366' }}>
              {profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'}
            </Text>

            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Text textStyle={{ fontSize: 36 }}>{statusEmoji}</Text>
              <Text textStyle={{ fontSize: 14, fontWeight: '600', color: isThisConnected ? '#34c759' : '#8e8e93' }}>
                {statusLabel}
              </Text>
            </View>

            <Text textStyle={{
              fontSize: 36,
              fontWeight: '300',
            }}>
              {formatDuration(isActive ? conn.elapsed : 0)}
            </Text>

            <Row spacing={20} style={{ marginTop: 8 }}>
              <View style={{ alignItems: 'center' }}>
                <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>
                  ▼ {formatBytes(isActive ? conn.bytesDownloaded : 0)}
                </Text>
                <Text textStyle={{ fontSize: 12, color: '#636366' }}>Download</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>
                  ▲ {formatBytes(isActive ? conn.bytesUploaded : 0)}
                </Text>
                <Text textStyle={{ fontSize: 12, color: '#636366' }}>Upload</Text>
              </View>
            </Row>
          </Column>

          {/* Server Info */}
          <Column spacing={8} style={{ alignSelf: 'stretch' }}>
            <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366' }}>
              Server Information
            </Text>
            <View style={[styles.card, { padding: 12 }]}>
              <Column spacing={8}>
                <InfoRow label="Server" value={profile.serverAddress} />
                <InfoRow label="IP" value={profile.serverIp} />
                <InfoRow label="Location" value={`${profile.city}, ${profile.region}`} />
                <InfoRow label="Protocol" value={`${profile.protocol === 'wireguard' ? 'WireGuard' : 'OpenVPN'} UDP ${profile.port}`} />
                <InfoRow label="Encryption" value={profile.encryption} />
                <InfoRow label="Connected" value={isThisConnected ? formatDuration(conn.elapsed) : '—'} />
              </Column>
            </View>
          </Column>

          {/* Error */}
          {conn.error && (
            <Text textStyle={{ color: '#ff3b30', fontSize: 13, textAlign: 'center' }}>
              {conn.error}
            </Text>
          )}

          {/* Action Button */}
          {isThisConnected || isThisDisconnecting ? (
            <Button
              variant="text"
              onPress={handleDisconnect}
              disabled={isThisDisconnecting}
              style={{ alignSelf: 'stretch', backgroundColor: '#ff3b30', borderRadius: 12, paddingVertical: 14 }}
            >
              <Text textStyle={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
                {isThisDisconnecting ? 'Disconnecting...' : 'DISCONNECT'}
              </Text>
            </Button>
          ) : (
            <Button
              variant="filled"
              onPress={handleConnect}
              disabled={isThisConnecting}
              style={{ alignSelf: 'stretch', paddingVertical: 14 }}
            >
              {isThisConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </Column>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(120,120,128,0.08)',
    borderRadius: 16,
    padding: Spacing.five,
  },
});
