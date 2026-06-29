import { useEffect, useCallback } from 'react';
import { ScrollView, Alert, View, Text, Pressable, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Host, Switch, Picker } from '@expo/ui';
import * as Application from 'expo-application';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import type { VpnProtocol } from '@/types/vpn';

// ponytail: gradient-like bg glow
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
          top: -60,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#5856D6',
          opacity: scheme === 'dark' ? 0.05 : 0.03,
        }}
      />
    </View>
  );
}

// ponytail: tab bar bottom padding constant

// ponytail: all-RN layout — Host/@expo/ui only wraps Switch/Picker.
// FieldGroup skipped because RN View/Text don't render inside Compose (Host) on Android.

// ─── helpers ───────────────────────────────────────────────

function Divider() {
  return <View className="h-px bg-black/10 dark:bg-white/10 mx-4" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center gap-2 px-1 pb-1 pt-6">
      <View className="w-1 h-4 rounded-full bg-[#00C781]" />
      <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
        {title}
      </Text>
    </View>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center py-3.5 px-4">
      <Text className="text-lg mr-3">{icon}</Text>
      <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>{label}</Text>
      <Host matchContents>
        <Switch value={value} onValueChange={onChange} />
      </Host>
    </View>
  );
}

function PickerRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center py-3.5 px-4">
      <Text className="text-lg mr-3">{icon}</Text>
      <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, selectable }: { icon?: string; label: string; value: string; selectable?: boolean }) {
  return (
    <View className="flex-row items-center py-3.5 px-4">
      {icon && <Text className="text-lg mr-3">{icon}</Text>}
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

function ActionRow({ icon, label, onPress, destructive }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3.5 px-4 active:opacity-60">
      <Text className="text-lg mr-3">{icon}</Text>
      <View className="flex-1">
        <Text className={`text-base ${destructive ? 'text-red-500' : 'text-black dark:text-white'}`}>{label}</Text>
      </View>
      <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
    </Pressable>
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
      ? '#00C781'
      : subscription?.status === 'expired'
        ? '#ff453a'
        : '#8e8e93';

  const statusLabel =
    subscription?.status === 'active'
      ? 'Active'
      : subscription?.status === 'expired'
        ? 'Expired'
        : 'No subscription';

  return (
    <View className="items-center py-6 px-4 relative overflow-hidden">
      {/* accent bar */}
      {subscription?.status === 'active' && (
        <View className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#00C781' }} />
      )}
      <View className="w-16 h-16 rounded-full bg-[#00C78115] items-center justify-center mb-3">
        <Text className="text-2xl">👤</Text>
      </View>
      <Text className="text-lg font-bold text-black dark:text-white">
        {subscriptionId || 'Not signed in'}
      </Text>
      <View className="flex-row items-center gap-2 mt-1.5">
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
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

  const insets = useSafeAreaInsets();

  // ponytail: loading skeleton deferred — add shimmer when real API with latency lands
  if (!settings.loaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <BgGlow />
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1">
      <View className="px-4 pt-4 gap-6" style={{ paddingBottom: insets.bottom + 20 }}>
        {/* profile card */}
        <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
          <ProfileCard subscription={auth.subscription} subscriptionId={auth.subscriptionId} />
        </View>

        {/* connection settings */}
        <View className="gap-2">
          <SectionHeader title="Connection" />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            <ToggleRow icon="🔗" label="Auto-Connect" value={settings.autoConnect} onChange={(v) => settings.update('autoConnect', v)} />
            <Divider />
            <ToggleRow icon="🛡️" label="Kill Switch" value={settings.killSwitch} onChange={(v) => settings.update('killSwitch', v)} />
            <Divider />
            <PickerRow icon="📡" label="Preferred Protocol">
              <ProtocolPicker />
            </PickerRow>
          </View>
        </View>

        {/* dns */}
        <View className="gap-2">
          <SectionHeader title="DNS" />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            <PickerRow icon="🌐" label="DNS Server">
              <DnsPicker />
            </PickerRow>
          </View>
        </View>

        {/* account */}
        <View className="gap-2">
          <SectionHeader title="Account" />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            <InfoRow icon="📋" label="Subscription" value={auth.subscription?.id || '—'} selectable />
            <Divider />
            <InfoRow icon="📊" label="Status" value={auth.subscription?.status || '—'} />
            <Divider />
            <InfoRow icon="⏰" label="Expires" value={auth.subscription?.expiresAt || '—'} />
          </View>
        </View>

        {/* actions */}
        <View className="gap-2">
          <SectionHeader title="Actions" />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            <ActionRow icon="🌐" label="Manage via Web Portal" onPress={handleWebPortal} />
            <Divider />
            <ActionRow icon="🚪" label="Logout" onPress={handleLogout} destructive />
            <Divider />
            <ActionRow icon="📱" label="Check for Updates" onPress={handleCheckUpdates} />
          </View>
        </View>

        {/* about */}
        <View className="gap-2">
          <SectionHeader title="About" />
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
            <InfoRow icon="📦" label="Version" value={Application.nativeApplicationVersion ?? '1.0.0'} />
            <Divider />
            <InfoRow icon="🔨" label="Build" value={Application.nativeBuildVersion ?? '—'} />
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}
