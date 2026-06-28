import { useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Switch } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';

// ─── row components ────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase px-1">
      {label}
    </Text>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-1">
      {children}
    </View>
  );
}

function Separator() {
  return <View className="h-px bg-black/10 dark:bg-white/10 ml-0" />;
}

function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View className="flex-row items-center py-3.5">
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
      {/* avatar circle */}
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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View className="px-4 pt-6 pb-8 gap-6">
        {/* profile */}
        <ProfileCard subscription={auth.subscription} subscriptionId={auth.subscriptionId} />

        {/* connection */}
        <View className="gap-2">
          <SectionHeader label="Connection" />
          <SettingsGroup>
            <View className="flex-row items-center py-3.5">
              <Text className="flex-1 text-base text-black dark:text-white">Auto-Connect</Text>
              <Host matchContents>
                <Switch
                  value={settings.autoConnect}
                  onValueChange={(v) => settings.update('autoConnect', v)}
                />
              </Host>
            </View>
            <Separator />
            <View className="flex-row items-center py-3.5">
              <Text className="flex-1 text-base text-black dark:text-white">Kill Switch</Text>
              <Host matchContents>
                <Switch
                  value={settings.killSwitch}
                  onValueChange={(v) => settings.update('killSwitch', v)}
                />
              </Host>
            </View>
            <Separator />
            <InfoRow
              label="Preferred Protocol"
              value={settings.preferredProtocol === 'auto' ? 'Auto' : settings.preferredProtocol === 'openvpn' ? 'OpenVPN' : 'WireGuard'}
            />
          </SettingsGroup>
        </View>

        {/* dns */}
        <View className="gap-2">
          <SectionHeader label="DNS" />
          <SettingsGroup>
            <InfoRow
              label="DNS Server"
              value={settings.dnsServer === 'default' ? 'Default (system)' : settings.dnsServer === 'cloudflare' ? 'Cloudflare 1.1.1.1' : 'Google 8.8.8.8'}
            />
          </SettingsGroup>
        </View>

        {/* account */}
        <View className="gap-2">
          <SectionHeader label="Account" />
          <SettingsGroup>
            <InfoRow label="Subscription" value={auth.subscription?.id || '—'} selectable />
            <Separator />
            <InfoRow label="Status" value={auth.subscription?.status || '—'} />
            <Separator />
            <InfoRow label="Expires" value={auth.subscription?.expiresAt || '—'} />
          </SettingsGroup>
        </View>

        {/* actions */}
        <View className="gap-3">
          <Pressable
            onPress={() => {}}
            className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-4 active:bg-black/10 dark:active:bg-white/15"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">🌐</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-black dark:text-white">Manage via Web Portal</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Billing, devices, and settings</Text>
              </View>
              <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="bg-red-500/10 dark:bg-red-500/15 rounded-2xl px-4 py-4 active:bg-red-500/20 dark:active:bg-red-500/25"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">🚪</Text>
              <View className="flex-1">
                <Text className="text-base font-medium text-red-500">Logout</Text>
                <Text className="text-xs text-red-500/70 mt-0.5">Sign out of your account</Text>
              </View>
              <Text className="text-lg text-red-300 dark:text-red-600">›</Text>
            </View>
          </Pressable>
        </View>

        {/* about */}
        <View className="gap-2">
          <SectionHeader label="About" />
          <SettingsGroup>
            <InfoRow label="Version" value="1.0.0" />
            <Separator />
            <InfoRow label="Build" value="2026.06.26" />
          </SettingsGroup>
        </View>

        {/* check updates */}
        <Pressable
          onPress={() => {}}
          className="bg-black/5 dark:bg-white/10 rounded-2xl px-4 py-4 active:bg-black/10 dark:active:bg-white/15"
        >
          <View className="flex-row items-center gap-3">
            <Text className="text-xl">📱</Text>
            <View className="flex-1">
              <Text className="text-base font-medium text-black dark:text-white">Check for Updates</Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Version 1.0.0</Text>
            </View>
            <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
