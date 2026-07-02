import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, TextInput, View, Text, Pressable, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { CURATED_CATEGORIES, CURATED_WHITELIST_APPS } from '@/constants/whitelist-apps';
import { validatePackageName, extractPackageNameFromUrl } from '@/utils/package-name';

function AddButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full ${
        disabled ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-[#00C781]/15 active:bg-[#00C781]/25'
      }`}
    >
      <Text className={`text-xs font-semibold ${disabled ? 'text-neutral-500 dark:text-neutral-400' : 'text-[#00C781]'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function WhitelistItem({
  packageName,
  appName,
  onRemove,
}: {
  packageName: string;
  appName?: string;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row items-center py-3.5 px-4 bg-black/5 dark:bg-white/10 rounded-2xl">
      <View className="flex-1 mr-3">
        <Text className="text-base text-black dark:text-white" numberOfLines={1}>
          {packageName}
        </Text>
        {appName && (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {appName}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onRemove}
        className="h-8 w-8 items-center justify-center rounded-full active:opacity-60"
      >
        <Text className="text-xl font-semibold text-red-500">×</Text>
      </Pressable>
    </View>
  );
}

function CuratedAppRow({
  appName,
  packageName,
  isAdded,
  onAdd,
}: {
  appName: string;
  packageName: string;
  isAdded: boolean;
  onAdd: () => void;
}) {
  return (
    <View className="flex-row items-center py-2.5 px-3">
      <Text className="flex-1 text-base text-black dark:text-white" numberOfLines={1}>
        {appName}
      </Text>
      <AddButton label={isAdded ? 'Added' : 'Add'} onPress={onAdd} disabled={isAdded} />
    </View>
  );
}

function CuratedCategory({
  category,
  apps,
  addedPackages,
  onAdd,
}: {
  category: string;
  apps: { appName: string; packageName: string }[];
  addedPackages: Set<string>;
  onAdd: (packageName: string, appName: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        className="flex-row items-center justify-between py-3 px-4 active:opacity-70"
      >
        <Text className="text-base font-semibold text-black dark:text-white">{category}</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {isOpen ? 'Hide' : 'Show'} ({apps.length})
        </Text>
      </Pressable>
      {isOpen && (
        <View className="border-t border-black/5 dark:border-white/5">
          {apps.map((app) => (
            <CuratedAppRow
              key={app.packageName}
              appName={app.appName}
              packageName={app.packageName}
              isAdded={addedPackages.has(app.packageName)}
              onAdd={() => onAdd(app.packageName, app.appName)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function WhitelistScreen() {
  const isUnsupported = Platform.OS === 'ios';
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const [manualInput, setManualInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const whitelistedApps = useSettingsStore((s) => s.whitelistedApps);
  const add = useSettingsStore((s) => s.addWhitelistedApp);
  const remove = useSettingsStore((s) => s.removeWhitelistedApp);

  const addedPackages = useMemo(
    () => new Set(whitelistedApps.map((a) => a.packageName)),
    [whitelistedApps]
  );

  const curatedByCategory = useMemo(() => {
    const groups: Record<string, { appName: string; packageName: string }[]> = {};
    for (const app of CURATED_WHITELIST_APPS) {
      (groups[app.category] ??= []).push({ appName: app.appName, packageName: app.packageName });
    }
    return CURATED_CATEGORIES.map((category) => ({ category, apps: groups[category] ?? [] }));
  }, []);

  const handleAdd = useCallback((packageName: string, appName?: string) => {
    setError(null);
    const validation = validatePackageName(packageName);
    if (validation) {
      setError(validation);
      return;
    }
    if (addedPackages.has(packageName)) {
      setError('This package is already whitelisted');
      return;
    }
    add({ packageName, appName, addedAt: Date.now() });
  }, [addedPackages, add]);

  const handleManualAdd = useCallback(() => {
    handleAdd(manualInput.trim());
    setManualInput('');
  }, [handleAdd, manualInput]);

  const handleUrlAdd = useCallback(() => {
    setError(null);
    const extracted = extractPackageNameFromUrl(urlInput);
    if (!extracted) {
      setError('Could not find a valid package name in that URL or text');
      return;
    }
    handleAdd(extracted);
    setUrlInput('');
  }, [handleAdd, urlInput]);

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        <View className="gap-4">
          {/* header / explanation */}
          <View className="bg-[#00C781]/10 dark:bg-[#00C781]/15 rounded-2xl p-4 gap-2">
            <Text className="text-base font-semibold text-black dark:text-white">
              Whitelist (Bypass VPN)
            </Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-300 leading-5">
              Apps added here will not route through the WireGuard tunnel. Changes take effect the
              next time you connect.
            </Text>
          </View>

          {/* iOS unsupported notice */}
          {isUnsupported && (
            <View className="bg-amber-500/10 rounded-2xl p-4 gap-2">
              <Text className="text-base font-semibold text-amber-700 dark:text-amber-400">
                Not available on iOS
              </Text>
              <Text className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-5">
                iOS does not allow apps to split traffic per app with standard VPN APIs. This
                whitelist only applies on Android devices.
              </Text>
            </View>
          )}

          {/* Play Store URL paste */}
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl p-4 gap-3">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">
              Paste Play Store URL
            </Text>
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://play.google.com/store/apps/details?id=..."
              placeholderTextColor={isDark ? '#8E8E93' : '#C7C7CC'}
              editable={!isUnsupported}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleUrlAdd}
              className="text-base text-black dark:text-white bg-white dark:bg-black/20 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10"
            />
            <Pressable
              onPress={handleUrlAdd}
              disabled={isUnsupported}
              className={`rounded-xl py-3 items-center ${
                isUnsupported ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-[#00C781] active:opacity-80'
              }`}
            >
              <Text className="text-base font-semibold text-white">Add from URL</Text>
            </Pressable>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              Open the Play Store, tap Share, copy the link, and paste it here.
            </Text>
          </View>

          {/* Quick add curated list */}
          {!isUnsupported && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase px-1">
                Quick Add
              </Text>
              <View className="gap-2">
                {curatedByCategory.map(({ category, apps }) => (
                  <CuratedCategory
                    key={category}
                    category={category}
                    apps={apps}
                    addedPackages={addedPackages}
                    onAdd={handleAdd}
                  />
                ))}
              </View>
            </View>
          )}

          {/* manual input fallback */}
          <View className="bg-black/5 dark:bg-white/10 rounded-2xl p-4 gap-3">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">
              Add manually
            </Text>
            <TextInput
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="com.example.app"
              placeholderTextColor={isDark ? '#8E8E93' : '#C7C7CC'}
              editable={!isUnsupported}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleManualAdd}
              className="text-base text-black dark:text-white bg-white dark:bg-black/20 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10"
            />
            {error && <Text className="text-sm text-red-500">{error}</Text>}
            <Pressable
              onPress={handleManualAdd}
              disabled={isUnsupported}
              className={`rounded-xl py-3 items-center ${
                isUnsupported ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-[#00C781] active:opacity-80'
              }`}
            >
              <Text className="text-base font-semibold text-white">Add to whitelist</Text>
            </Pressable>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              Enter the Android package name directly (e.g. com.google.android.youtube).
            </Text>
          </View>

          {/* list */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase px-1">
              Whitelisted apps ({whitelistedApps.length})
            </Text>
            {whitelistedApps.length === 0 ? (
              <View className="items-center py-12 px-4">
                <View className="w-12 h-12 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 items-center justify-center">
                  <Text className="text-2xl text-neutral-400 dark:text-neutral-500">✓</Text>
                </View>
                <Text className="text-neutral-400 dark:text-neutral-500 text-sm mt-4 text-center">
                  No apps whitelisted yet. Choose from the list, paste a Play Store URL, or enter a
                  package name manually.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {whitelistedApps.map((app) => (
                  <WhitelistItem
                    key={app.packageName}
                    packageName={app.packageName}
                    appName={app.appName}
                    onRemove={() => remove(app.packageName)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
