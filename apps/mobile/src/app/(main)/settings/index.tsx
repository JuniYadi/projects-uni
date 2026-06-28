import { useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button, Switch } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Spacing } from '@/constants/theme';

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

// ponytail: plain View instead of FieldGroup — FieldGroup is a ScrollView; nesting it inside
// the screen ScrollView causes nested scroll errors. Use this when grouped rows are needed.
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={{ flex: 1 }}>{label}</Text>
      <Text style={{ color: '#636366' }} selectable={selectable}>{value}</Text>
    </View>
  );
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
        <SettingsGroup>
          <Switch
            label="Auto-Connect"
            value={settings.autoConnect}
            onValueChange={(v) => settings.update('autoConnect', v)}
          />
          <View style={styles.separator} />
          <Switch
            label="Kill Switch"
            value={settings.killSwitch}
            onValueChange={(v) => settings.update('killSwitch', v)}
          />
          <View style={styles.separator} />
          <InfoRow
            label="Preferred Protocol"
            value={settings.preferredProtocol === 'auto' ? 'Auto' : settings.preferredProtocol === 'openvpn' ? 'OpenVPN' : 'WireGuard'}
          />
        </SettingsGroup>

        {/* DNS */}
        <SectionHeader label="DNS" />
        <SettingsGroup>
          <InfoRow
            label="DNS Server"
            value={settings.dnsServer === 'default' ? 'Default (system)' : settings.dnsServer === 'cloudflare' ? 'Cloudflare 1.1.1.1' : 'Google 8.8.8.8'}
          />
        </SettingsGroup>

        {/* Account */}
        <SectionHeader label="ACCOUNT" />
        <SettingsGroup>
          <InfoRow label="Subscription" value={auth.subscription?.id || '—'} selectable />
          <View style={styles.separator} />
          <InfoRow label="Status" value={auth.subscription?.status || '—'} />
          <View style={styles.separator} />
          <InfoRow label="Expires" value={auth.subscription?.expiresAt || '—'} />
        </SettingsGroup>

        <Host style={{ width: '100%' }}>
          <Button variant="outlined" onPress={() => {}} label="📋 Manage via Web Portal" style={{ minHeight: 44 }} />
        </Host>

        <Host style={{ width: '100%' }}>
          <Button variant="filled" onPress={handleLogout} label="🚪 Logout" style={{ minHeight: 44 }} />
        </Host>

        {/* About */}
        <SectionHeader label="ABOUT" />
        <SettingsGroup>
          <InfoRow label="Version" value="1.0.0" />
          <View style={styles.separator} />
          <InfoRow label="Build" value="2026.06.26" />
        </SettingsGroup>

        <Host style={{ width: '100%' }}>
          <Button variant="outlined" onPress={() => {}} label="📱 Check for Updates" style={{ minHeight: 44 }} />
        </Host>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.four },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#636366', marginLeft: 4 },
  group: { backgroundColor: 'rgba(120,120,128,0.08)', borderRadius: 12, paddingHorizontal: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 0 },
});
