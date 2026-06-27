import { useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Column, Row, Text, Button, Switch, FieldGroup } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const settings = useSettingsStore();
  const disconnect = useConnectionStore((s) => s.disconnect);

  useEffect(() => {
    settings.load();
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await disconnect();
          await auth.logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [auth, disconnect, router]);

  return (
    <Host style={{ width: '100%', height: '100%' }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <Column spacing={Spacing.four}>
          {/* Connection */}
          <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 }}>
            CONNECTION
          </Text>
          <FieldGroup>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Auto-Connect</Text>
              <Switch value={settings.autoConnect} onValueChange={(v) => settings.update('autoConnect', v)} />
            </Row>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Kill Switch</Text>
              <Switch value={settings.killSwitch} onValueChange={(v) => settings.update('killSwitch', v)} />
            </Row>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Preferred Protocol</Text>
              <Text textStyle={{ color: '#636366' }}>
                {settings.preferredProtocol === 'auto' ? 'Auto' : settings.preferredProtocol === 'openvpn' ? 'OpenVPN' : 'WireGuard'}
              </Text>
            </Row>
          </FieldGroup>

          {/* DNS */}
          <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 }}>
            DNS
          </Text>
          <FieldGroup>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>DNS Server</Text>
              <Text textStyle={{ color: '#636366' }}>
                {settings.dnsServer === 'default' ? 'Default (system)' : settings.dnsServer === 'cloudflare' ? 'Cloudflare 1.1.1.1' : 'Google 8.8.8.8'}
              </Text>
            </Row>
          </FieldGroup>

          {/* Account */}
          <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 }}>
            ACCOUNT
          </Text>
          <FieldGroup>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Subscription</Text>
              <Text textStyle={{ color: '#636366' }} selectable>{auth.subscription?.id || '—'}</Text>
            </Row>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Status</Text>
              <Text textStyle={{ color: '#636366' }}>{auth.subscription?.status || '—'}</Text>
            </Row>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Expires</Text>
              <Text textStyle={{ color: '#636366' }}>{auth.subscription?.expiresAt || '—'}</Text>
            </Row>
          </FieldGroup>

          <Button variant="outlined" onPress={() => {}} style={{ paddingVertical: 12 }}>
            📋 Manage via Web Portal
          </Button>

          <Button
            variant="text"
            onPress={handleLogout}
            style={{ backgroundColor: '#ff3b30', borderRadius: 12, paddingVertical: 14 }}
          >
            <Text textStyle={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>🚪 Logout</Text>
          </Button>

          {/* About */}
          <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 }}>
            ABOUT
          </Text>
          <FieldGroup>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Version</Text>
              <Text textStyle={{ color: '#636366' }}>1.0.0</Text>
            </Row>
            <Row spacing={8} alignment="center" style={styles.fieldRow}>
              <Text textStyle={{ flex: 1 }}>Build</Text>
              <Text textStyle={{ color: '#636366' }}>2026.06.26</Text>
            </Row>
          </FieldGroup>

          <Button variant="outlined" onPress={() => {}} style={{ paddingVertical: 12 }}>
            📱 Check for Updates
          </Button>
        </Column>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.four, gap: Spacing.four },
  fieldRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
