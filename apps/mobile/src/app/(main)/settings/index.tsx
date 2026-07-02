import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Alert, Modal, View, Text, Pressable, useColorScheme, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Application from 'expo-application';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AppTheme } from '@/types/vpn';

// ─── theme helpers ─────────────────────────────────────────

function useFill() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark.backgroundElement : Colors.light.backgroundElement;
}

function useAccent() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark.accent : Colors.light.accent;
}

// ─── shared UI primitives ─────────────────────────────────

function Divider() {
  return <View className="h-px bg-black/10 dark:bg-white/10 ml-4" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="px-1 pb-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
      {title}
    </Text>
  );
}

function SectionFooter({ text }: { text: string }) {
  return (
    <Text className="px-1 pt-1.5 text-xs text-neutral-500 dark:text-neutral-400 leading-4">
      {text}
    </Text>
  );
}

function LinkRow({
  label,
  value,
  onPress,
  destructive,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 px-4 active:opacity-60">
      <Text
        className={`flex-1 text-base ${
          destructive ? 'text-red-500' : 'text-black dark:text-white'
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value && (
        <Text className="text-base text-neutral-500 dark:text-neutral-400 mr-2" numberOfLines={1}>
          {value}
        </Text>
      )}
      <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
    </Pressable>
  );
}

function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View className="flex-row items-center py-3 px-4">
      <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>
        {label}
      </Text>
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

function SelectRow({
  label,
  selectedValue,
  onValueChange,
  options,
}: {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const selectedLabel = options.find((o) => o.value === selectedValue)?.label ?? selectedValue;

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center py-3 px-4 active:opacity-60"
      >
        <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>
          {label}
        </Text>
        <Text
          className="text-base text-neutral-500 dark:text-neutral-400 mr-2 max-w-[50%]"
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Text className="text-lg text-neutral-300 dark:text-neutral-600">›</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setVisible(false)} />
          <View
            className="bg-white dark:bg-zinc-900 rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="items-center py-2">
              <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </View>
            <Text
              className="text-center font-semibold text-base text-black dark:text-white mb-2 px-4"
              numberOfLines={1}
            >
              {label}
            </Text>

            <View className="mx-4 mb-4 rounded-xl bg-black/5 dark:bg-white/10 overflow-hidden">
              {options.map((o, index) => (
                <View key={o.value}>
                  <Pressable
                    onPress={() => {
                      onValueChange(o.value);
                      setVisible(false);
                    }}
                    className="flex-row items-center py-3 px-4 active:opacity-60"
                  >
                    <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>
                      {o.label}
                    </Text>
                    {o.value === selectedValue && (
                      <Text className="text-base font-semibold text-blue-500 ml-2">✓</Text>
                    )}
                  </Pressable>
                  {index < options.length - 1 && (
                    <View className="h-px bg-black/10 dark:bg-white/10 ml-4" />
                  )}
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => setVisible(false)}
              className="mx-4 mb-4 rounded-xl bg-white dark:bg-zinc-800 py-3.5 items-center active:opacity-60"
            >
              <Text className="text-base font-semibold text-blue-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── profile card ──────────────────────────────────────────

function ProfileCard({
  subscription,
  subscriptionId,
}: {
  subscription: { id: string; status: string; expiresAt?: string } | null;
  subscriptionId: string | null;
}) {
  const fill = useFill();
  const accent = useAccent();
  const theme = useTheme();

  const statusColor = useMemo(() => {
    if (subscription?.status === 'active') return accent;
    if (subscription?.status === 'expired') return '#ff453a';
    return theme.textSecondary;
  }, [subscription, accent, theme]);

  const statusLabel = useMemo(() => {
    if (subscription?.status === 'active') return 'Active';
    if (subscription?.status === 'expired') return 'Expired';
    return 'No subscription';
  }, [subscription]);

  const displayName = subscriptionId || 'Not signed in';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-row items-center px-4 py-3.5">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: fill }}
      >
        <Text className="text-lg font-semibold text-black dark:text-white">{initial}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-base text-black dark:text-white" numberOfLines={1}>
          {displayName}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">{statusLabel}</Text>
        </View>
      </View>
      {subscription?.expiresAt && (
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">{subscription.expiresAt}</Text>
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
  const loadSettings = useSettingsStore((s) => s.load);
  const update = useSettingsStore((s) => s.update);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure?', [
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

  const handleWebPortal = useCallback(() => {
    WebBrowser.openBrowserAsync('https://univpn.example.com/portal');
  }, []);

  const handleCheckUpdates = useCallback(() => {
    const version = Application.nativeApplicationVersion ?? '1.0.0';
    const build = Application.nativeBuildVersion ?? '—';
    Alert.alert('UniVPN', `Version ${version} (${build})\nYou have the latest version.`);
  }, []);

  const whitelistCount = settings.whitelistedApps.length;
  const whitelistValue = whitelistCount > 0 ? `${whitelistCount} app${whitelistCount > 1 ? 's' : ''}` : undefined;

  const insets = useSafeAreaInsets();
  const theme = useTheme();

  if (!settings.loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1">
        <View className="px-4 pt-2 gap-4" style={{ paddingBottom: insets.bottom + 20 }}>
          {/* Profile */}
          <View className="gap-2">
            <SectionHeader title="Account" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <ProfileCard subscription={auth.subscription} subscriptionId={auth.subscriptionId} />
              <Divider />
              <LinkRow label="Logout" onPress={handleLogout} destructive />
            </View>
          </View>

          {/* Connection */}
          <View className="gap-2">
            <SectionHeader title="Connection" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <SelectRow
                label="DNS Server"
                selectedValue={settings.dnsServer}
                onValueChange={(v) => update('dnsServer', v)}
                options={[
                  { label: 'Default (system)', value: 'default' },
                  { label: 'Cloudflare 1.1.1.1', value: 'cloudflare' },
                  { label: 'Google 8.8.8.8', value: 'google' },
                ]}
              />
              <Divider />
              <LinkRow
                label="Whitelist (Bypass VPN)"
                value={whitelistValue}
                onPress={() => router.push('/(main)/settings/whitelist')}
              />
            </View>
            <SectionFooter text="Choose a DNS server and manage apps that bypass the VPN tunnel." />
          </View>

          {/* Appearance */}
          <View className="gap-2">
            <SectionHeader title="Appearance" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <SelectRow
                label="Theme"
                selectedValue={settings.theme}
                onValueChange={(v) => update('theme', v as AppTheme)}
                options={[
                  { label: 'System', value: 'system' },
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]}
              />
            </View>
            <SectionFooter text="System follows your device theme. Light or Dark forces the app appearance." />
          </View>

          {/* Support / Actions */}
          <View className="gap-2">
            <SectionHeader title="Support" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <LinkRow label="Manage via Web Portal" onPress={handleWebPortal} />
              <Divider />
              <LinkRow label="Check for Updates" onPress={handleCheckUpdates} />
            </View>
          </View>

          {/* About */}
          <View className="gap-2">
            <SectionHeader title="About" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <InfoRow label="Version" value={Application.nativeApplicationVersion ?? '1.0.0'} />
              <Divider />
              <InfoRow label="Build" value={Application.nativeBuildVersion ?? '—'} />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
