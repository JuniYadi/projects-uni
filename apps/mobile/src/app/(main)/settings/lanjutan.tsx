import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { APP_URL } from '@univpn/shared';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Group, Note, Row, Screen } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AppTheme, HomeButtonStyle } from '@/types/vpn';
import { isNewerVersion } from '@/utils/version';

const A = Strings.advanced;

// ponytail: no release feed/endpoint exists yet, so nothing newer is ever found.
// Return the latest version string here once the API exposes one.
async function fetchLatestVersion(): Promise<string | null> {
  return null;
}

type Option = { value: string; label: string; hint: string };

function toOptions(o: Record<string, { label: string; hint: string }>): Option[] {
  return Object.entries(o).map(([value, { label, hint }]) => ({ value, label, hint }));
}

function OptionSheet({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: Option[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <Sheet visible onClose={onClose} title={title}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: o.value === selected }}
          onPress={() => {
            onSelect(o.value);
            onClose();
          }}
          style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>{o.label}</Text>
            {o.hint ? (
              <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary }}>{o.hint}</Text>
            ) : null}
          </View>
          {o.value === selected && <Icon name="check" color={theme.accent} size={20} />}
        </Pressable>
      ))}
    </Sheet>
  );
}

export default function AdvancedScreen() {
  const router = useRouter();
  const { dnsServer, theme, autoUpdate, buttonStyle, update } = useSettingsStore();
  const [sheet, setSheet] = useState<'dns' | 'theme' | 'buttonStyle' | null>(null);
  const [latest, setLatest] = useState<string | null | undefined>(undefined); // undefined = no dialog

  const version = Application.nativeApplicationVersion ?? '1.0.0';
  const build = Application.nativeBuildVersion;
  const dnsOptions = toOptions(A.dnsOptions);
  const themeOptions = toOptions(A.themeOptions);
  const buttonStyleOptions = toOptions(A.buttonStyleOptions);
  const label = (opts: Option[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
  const hasUpdate = !!latest && isNewerVersion(latest, version);

  return (
    <Screen>
      <Note text={A.hint} />
      <Group>
        <Row label={A.dns} value={label(dnsOptions, dnsServer)} onPress={() => setSheet('dns')} />
        <Row label={A.theme} value={label(themeOptions, theme)} onPress={() => setSheet('theme')} />
        <Row
          label={A.buttonStyle}
          value={label(buttonStyleOptions, buttonStyle ?? 'cyber')}
          onPress={() => setSheet('buttonStyle')}
        />
        <Row label={A.connectionDetail} onPress={() => router.push('/(main)/settings/detail-koneksi')} last />
      </Group>
      <Group>
        <Row label={A.checkUpdate} onPress={async () => setLatest(await fetchLatestVersion())} />
        <Row
          label={A.autoUpdate}
          hint={A.autoUpdateHint}
          right={<Switch label={A.autoUpdate} value={autoUpdate} onValueChange={(v) => update('autoUpdate', v)} />}
        />
        <Row label={A.version} value={build ? `${version} (build ${build})` : version} />
        <Row
          label={Strings.settings.manageWeb}
          onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/portal`)}
          last
        />
      </Group>

      {sheet === 'dns' && (
        <OptionSheet
          title={A.dnsPick}
          options={dnsOptions}
          selected={dnsServer}
          onSelect={(v) => update('dnsServer', v)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'theme' && (
        <OptionSheet
          title={A.themePick}
          options={themeOptions}
          selected={theme}
          onSelect={(v) => update('theme', v as AppTheme)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'buttonStyle' && (
        <OptionSheet
          title={A.buttonStylePick}
          options={buttonStyleOptions}
          selected={buttonStyle ?? 'cyber'}
          onSelect={(v) => update('buttonStyle', v as HomeButtonStyle)}
          onClose={() => setSheet(null)}
        />
      )}
      <Dialog
        visible={latest !== undefined}
        onClose={() => setLatest(undefined)}
        title={hasUpdate ? A.newVersion : A.upToDate}
        message={hasUpdate ? A.newVersionMsg(latest!) : A.upToDateMsg(version)}
      >
        {hasUpdate ? (
          <>
            <Button label={A.update} onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/portal`)} />
            <Button label={A.later} variant="secondary" onPress={() => setLatest(undefined)} />
          </>
        ) : (
          <Button label={A.ok} onPress={() => setLatest(undefined)} />
        )}
      </Dialog>
    </Screen>
  );
}
