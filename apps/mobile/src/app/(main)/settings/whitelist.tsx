import { useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Group, Note, Row, Screen } from '@/components/ui/list-row';
import { Figtree } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { extractPackageNameFromUrl, validatePackageName } from '@/utils/package-name';

function Field({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const theme = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontFamily: Figtree.regular,
        fontSize: 14,
        color: theme.text,
        backgroundColor: theme.background,
      }}
    />
  );
}

export default function PickAppsScreen() {
  const theme = useTheme();
  const apps = useSettingsStore((s) => s.whitelistedApps);
  const add = useSettingsStore((s) => s.addWhitelistedApp);
  const remove = useSettingsStore((s) => s.removeWhitelistedApp);
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [pkg, setPkg] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (Platform.OS !== 'android') {
    return (
      <Screen>
        <Note text={Strings.apps.androidOnly} />
      </Screen>
    );
  }

  const submit = async (name: string | null, invalid: string) => {
    if (!name || validatePackageName(name)) return setError(invalid);
    if (apps.some((a) => a.packageName === name)) return setError(Strings.apps.already);
    await add({ packageName: name, addedAt: Date.now() });
    setError(null);
    setLink('');
    setPkg('');
    setAdding(false);
  };

  return (
    <Screen>
      <Note text={Strings.apps.intro} />
      {apps.length > 0 ? (
        <Group>
          {apps.map((a, i) => (
            <Row
              key={a.packageName}
              label={a.appName ?? a.packageName}
              hint={a.appName ? a.packageName : undefined}
              right={
                <Button label={Strings.apps.remove} variant="secondary" onPress={() => remove(a.packageName)} />
              }
              last={i === apps.length - 1}
            />
          ))}
        </Group>
      ) : (
        <Note text={Strings.apps.empty} />
      )}
      {adding ? (
        <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: Figtree.semibold, fontSize: 16, color: theme.text }}>{Strings.apps.add}</Text>
          <Field value={link} onChangeText={setLink} placeholder={Strings.apps.fromLink} />
          <Button
            label={Strings.apps.fromLinkAction}
            onPress={() => submit(extractPackageNameFromUrl(link), Strings.apps.linkInvalid)}
          />
          <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
            {Strings.apps.or}
          </Text>
          <Field value={pkg} onChangeText={setPkg} placeholder={Strings.apps.packageName} />
          <Note text={Strings.apps.packageHint} />
          <Button
            label={Strings.actions.apply}
            variant="secondary"
            onPress={() => submit(pkg.trim(), Strings.apps.packageInvalid)}
          />
          {error && (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: Figtree.regular, fontSize: 13, color: theme.error }}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <Button label={Strings.apps.add} onPress={() => setAdding(true)} />
      )}
    </Screen>
  );
}
