import { useEffect, useCallback } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Host, Switch, FieldGroup, Picker } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import type { VpnProtocol } from '@/types/vpn';

// ─── row helpers ───────────────────────────────────────────

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center py-3.5 px-4">
      <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View className="flex-row items-center py-3.5 px-4">
      <Text className="flex-1 text-base text-black dark:text-white">{label}</Text>
      <Text
        className="text-base text-neutral-500 dark:text-neutral-400 max-w-[55%] text-right"
        selectable={selectable}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ponytail: Picker wrapped in minimal Host, appearance="menu" gives native popup
function ProtocolPicker() {
  const preferredProtocol = useSettingsStore((s) => s.preferredProtocol);
  const update = useSettingsStore((s) => s.update);
  return (
    <Host matchContents>
      <Picker
        selectedValue={preferredProtocol}
        onValueChange={(v) => update('preferredProtocol', v as VpnProtocol | 'auto')}
        appearance="menu"
      >
        <Picker.Item label="Auto" value="auto" />
        <Picker.Item label="WireGuard" value="wireguard" />
        <Picker.Item label="OpenVPN" value="openvpn" />
      </Picker>
    </Host>
  );
}

function DnsPicker() {
  const dnsServer = useSettingsStore((s) => s.dnsServer);
  const update = useSettingsStore((s) => s.update);
  return (
    <Host matchContents>
      <Picker
        selectedValue={dnsServer}
        onValueChange={(v) => update('dnsServer', v as string)}
        appearance="menu"
      >
        <Picker.Item label="Default (system)" value="default" />
        <Picker.Item label="Cloudflare 1.1.1.1" value="cloudflare" />
        <Picker.Item label="Google 8.8.8.8" value="google" />
      </Picker>
    </Host>
  );
}

// ─── profile card ──────────────────────────────────────────

function ProfileCard({
  subscription,
  subscriptionId,
}: {
  subscription: { id: string; status: string; expiresAt: string } | null;
  subscriptionId: string | null;
}) {
  const statusColor =
    subscription?.status === 'active'
      ? 'bg-green-500'
      : subscription?.status === 'expired'
        ? 'bg-red-500'
        : 'bg-neutral-400';

  const statusLabel =
    subscription?.status === 'active'
      ? 'Active'
      : subscription?.status === 'expired'
        ? 'Expired'
      : 'No subscription';

  return (
    <View className="items-center py-6 px-4 bg-black/5 dark:bg-white/10 rounded-2xl">
      <View className="w-16 h-16 rounded-full bg-black/10 dark:bg-white/15 items-center justify-center mb-3">
        <Text className="text-2xl">👤</Text>
      </View>
      <Text className="text-lg font-bold text-black dark:text-white">
        {subscriptionId || 'Not signed in'}
      </Text>
      <View className="flex-row items-center gap-2 mt-1.5">
        <View className={`w-2 h-2 rounded-full ${statusColor}`} />
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{statusLabel}</Text>
      </View>
      {subscription?.expiresAt && (
        <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Expires {subscription.expiresAt}
        </Text>
      )}
    </View>
  );
}

// ─── main screen ───────────────────────────────────────────

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

  const handleWebPortal = useCallback(() => {
    // ponytail: static URL — make configurable when multi-region portals land
    WebBrowser.openBrowserAsync('https://univpn.example.com/portal');
  }, []);

  const handleCheckUpdates = useCallback(() => {
    // ponytail: add expo-updates when OTA update flow is implemented
    Alert.alert('Up to Date', 'You have the latest version.');
  }, []);

  // ponytail: loading skeleton deferred — add shimmer when real API with latency lands
  if (!settings.loaded) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Host style={{ flex: 1 }}>
        <FieldGroup>
          <FieldGroup.Section style={{ paddingHorizontal: 0 }}>
            <ProfileCard subscription={auth.subscription} subscriptionId={auth.subscriptionId} />
          </FieldGroup.Section>

          <FieldGroup.Section title="Connection" style={{ paddingHorizontal: 0 }}>
            <ToggleRow label="Auto-Connect" value={settings.autoConnect} onChange={(v) => settings.update('autoConnect', v)} />
            <ToggleRow label="Kill Switch" value={settings.killSwitch} onChange={(v) => settings.update('killSwitch', v)} />
            <View className="flex-row items-center py-3.5 px-4">
              <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>Preferred Protocol</Text>
              <ProtocolPicker />
            </View>
          </FieldGroup.Section>

          <FieldGroup.Section title="DNS" style={{ paddingHorizontal: 0 }}>
            <View className="flex-row items-center py-3.5 px-4">
              <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>DNS Server</Text>
              <DnsPicker />
            </View>
          </FieldGroup.Section>

          <FieldGroup.Section title="Account" style={{ paddingHorizontal: 0 }}>
            <InfoRow label="Subscription" value={auth.subscription?.id || '—'} selectable />
            <InfoRow label="Status" value={auth.subscription?.status || '—'} />
            <InfoRow label="Expires" value={auth.subscription?.expiresAt || '—'} />
          </FieldGroup.Section>

          <FieldGroup.Section title="Actions" style={{ paddingHorizontal: 0 }}>
            <Pressable onPress={handleWebPortal} className="flex-row items-center py-3.5 px-4 active:opacity-60">
              <Text className="text-xl mr-3">🌐</Text>
              <View className="flex-1">
                <Text className="text-base text-black dark:text-white">Manage via Web Portal</Text>
              </View>
              <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
            </Pressable>
            <Pressable onPress={handleLogout} className="flex-row items-center py-3.5 px-4 active:opacity-60">
              <Text className="text-xl mr-3">🚪</Text>
              <View className="flex-1">
                <Text className="text-base text-red-500">Logout</Text>
              </View>
              <Text className="text-lg text-red-300 dark:text-red-600">›</Text>
            </Pressable>
            <Pressable onPress={handleCheckUpdates} className="flex-row items-center py-3.5 px-4 active:opacity-60">
              <Text className="text-xl mr-3">📱</Text>
              <View className="flex-1">
                <Text className="text-base text-black dark:text-white">Check for Updates</Text>
              </View>
              <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
            </Pressable>
          </FieldGroup.Section>

          <FieldGroup.Section title="About" style={{ paddingHorizontal: 0 }}>
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Build" value="2026.06.26" />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </SafeAreaView>
  );
}
