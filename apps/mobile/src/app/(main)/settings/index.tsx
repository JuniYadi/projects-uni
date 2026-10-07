import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Group, Row, Screen } from '@/components/ui/list-row';
import { Switch } from '@/components/ui/switch';
import { Strings } from '@/constants/strings';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { killSwitch, autoConnect, load, update } = useSettingsStore();
  const subscriptionId = useAuthStore((s) => s.subscriptionId);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Group>
        <Row
          label={Strings.settings.killSwitch}
          hint={Strings.settings.killSwitchHint}
          right={
            <Switch label={Strings.settings.killSwitch} value={killSwitch} onValueChange={(v) => update('killSwitch', v)} />
          }
        />
        <Row
          label={Strings.settings.autoConnect}
          hint={Strings.settings.autoConnectHint}
          right={
            <Switch label={Strings.settings.autoConnect} value={autoConnect} onValueChange={(v) => update('autoConnect', v)} />
          }
          last={Platform.OS !== 'android'}
        />
        {Platform.OS === 'android' && (
          <Row
            label={Strings.settings.pickApps}
            hint={Strings.settings.pickAppsHint}
            onPress={() => router.push('/(main)/settings/whitelist')}
            last
          />
        )}
      </Group>
      <Group>
        <Row
          label={Strings.account.title}
          value={subscriptionId ?? undefined}
          onPress={() => router.push('/(main)/settings/akun')}
        />
        <Row
          label="Log & Diagnostik"
          hint="Riwayat status & analisis koneksi"
          onPress={() => router.push('/(main)/settings/log')}
        />
        <Row label={Strings.settings.advanced} onPress={() => router.push('/(main)/settings/lanjutan')} last />
      </Group>
    </Screen>
  );
}
