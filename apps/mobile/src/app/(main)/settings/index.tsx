import { useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button, Switch, FieldGroup } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const settings = useSettingsStore();
  const disconnect = useConnectionStore((s) => s.disconnect);

  useEffect(() => { settings.load(); }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await disconnect(); await auth.logout(); router.replace('/(auth)/login'); },
      },
    ]);
  }, [auth, disconnect, router]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <View style={{ gap: Spacing.four }}>
        {/* Connection */}
        <SectionHeader label="CONNECTION" />
        <FieldGroup>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Auto-Connect</Text>
            <Switch value={settings.autoConnect} onValueChange={(v) => settings.update('autoConnect', v)} />
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Kill Switch</Text>
            <Switch value={settings.killSwitch} onValueChange={(v) => settings.update('killSwitch', v)} />
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Preferred Protocol</Text>
            <Text style={{ color: '#636366' }}>
              {settings.preferredProtocol === 'auto' ? 'Auto' : settings.preferredProtocol === 'openvpn' ? 'OpenVPN' : 'WireGuard'}
            </Text>
          </View>
        </FieldGroup>

        {/* DNS */}
        <SectionHeader label="DNS" />
        <FieldGroup>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>DNS Server</Text>
            <Text style={{ color: '#636366' }}>
              {settings.dnsServer === 'default' ? 'Default (system)' : settings.dnsServer === 'cloudflare' ? 'Cloudflare 1.1.1.1' : 'Google 8.8.8.8'}
            </Text>
          </View>
        </FieldGroup>

        {/* Account */}
        <SectionHeader label="ACCOUNT" />
        <FieldGroup>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Subscription</Text>
            <Text style={{ color: '#636366' }} selectable>{auth.subscription?.id || '—'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Status</Text>
            <Text style={{ color: '#636366' }}>{auth.subscription?.status || '—'}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Expires</Text>
            <Text style={{ color: '#636366' }}>{auth.subscription?.expiresAt || '—'}</Text>
          </View>
        </FieldGroup>

        <Host style={{ width: '100%' }}>
          <Button variant="outlined" onPress={() => {}} label="📋 Manage via Web Portal" />
        </Host>

        <Host style={{ width: '100%' }}>
          <Button variant="filled" onPress={handleLogout} label="🚪 Logout" />
        </Host>

        {/* About */}
        <SectionHeader label="ABOUT" />
        <FieldGroup>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Version</Text>
            <Text style={{ color: '#636366' }}>1.0.0</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={{ flex: 1 }}>Build</Text>
            <Text style={{ color: '#636366' }}>2026.06.26</Text>
          </View>
        </FieldGroup>

        <Host style={{ width: '100%' }}>
          <Button variant="outlined" onPress={() => {}} label="📱 Check for Updates" />
        </Host>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.four },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
});
