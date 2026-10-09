import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Note } from '@/components/ui/list-row';
import { Switch } from '@/components/ui/switch';
import { Figtree } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import UnivpnNative from '../../../../modules/univpn-native';

interface InstalledApp {
  packageName: string;
  appName: string;
}

// Module-level icon cache — survives re-renders, cleared on app restart.
const iconCache: Record<string, string | null> = {};

/** Fetches and renders an app icon lazily. Falls back to a placeholder box. */
function AppIcon({ packageName }: { packageName: string }) {
  const theme = useTheme();
  const cached = iconCache[packageName];
  const [fetchedIcon, setFetchedIcon] = useState<string | null | undefined>(undefined);
  const icon = cached !== undefined ? cached : fetchedIcon;

  useEffect(() => {
    if (packageName in iconCache) {
      return;
    }
    let cancelled = false;
    UnivpnNative.getAppIcon(packageName)
      .then((b64) => {
        if (cancelled) return;
        iconCache[packageName] = b64;
        setFetchedIcon(b64);
      })
      .catch(() => {
        if (cancelled) return;
        iconCache[packageName] = null;
        setFetchedIcon(null);
      });
    return () => {
      cancelled = true;
    };
  }, [packageName]);

  if (icon) {
    return (
      <Image
        source={{ uri: `data:image/png;base64,${icon}` }}
        style={{ width: 36, height: 36, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  }

  // Placeholder while loading or unavailable
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: theme.backgroundSelected,
      }}
    />
  );
}

interface AppRowProps {
  app: InstalledApp;
  enabled: boolean;
  onToggle: (app: InstalledApp, value: boolean) => void;
  first: boolean;
  last: boolean;
}

function AppRow({ app, enabled, onToggle, first, last }: AppRowProps) {
  const theme = useTheme();
  const radius = 16;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 12,
        backgroundColor: theme.backgroundElement,
        borderTopLeftRadius: first ? radius : 0,
        borderTopRightRadius: first ? radius : 0,
        borderBottomLeftRadius: last ? radius : 0,
        borderBottomRightRadius: last ? radius : 0,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: theme.backgroundSelected,
        minHeight: 56,
      }}
    >
      <AppIcon packageName={app.packageName} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{ fontFamily: Figtree.medium, fontSize: 15, color: theme.text }}
          numberOfLines={1}
        >
          {app.appName}
        </Text>
        <Text
          style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary }}
          numberOfLines={1}
        >
          {app.packageName}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={(v) => onToggle(app, v)}
        label={enabled ? `${app.appName} dikecualikan` : `Kecualikan ${app.appName}`}
      />
    </View>
  );
}

export default function PickAppsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const whitelisted = useSettingsStore((s) => s.whitelistedApps);
  const addApp = useSettingsStore((s) => s.addWhitelistedApp);
  const removeApp = useSettingsStore((s) => s.removeWhitelistedApp);

  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(Platform.OS === 'android');
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    UnivpnNative.getInstalledApps()
      .then((apps) => {
        setInstalledApps(apps);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, []);

  // Dynamic membership — Set is appropriate here (runtime insertion/deletion via toggle)
  const whitelistedSet = useMemo(
    () => new Set(whitelisted.map((a) => a.packageName)),
    [whitelisted]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (a) => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q)
    );
  }, [installedApps, search]);

  const toggle = useCallback(
    async (app: InstalledApp, enabled: boolean) => {
      if (enabled) {
        await addApp({ packageName: app.packageName, appName: app.appName, addedAt: Date.now() });
      } else {
        await removeApp(app.packageName);
      }
    },
    [addApp, removeApp]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: InstalledApp; index: number }) => (
      <AppRow
        app={item}
        enabled={whitelistedSet.has(item.packageName)}
        onToggle={toggle}
        first={index === 0}
        last={index === filtered.length - 1}
      />
    ),
    [whitelistedSet, toggle, filtered.length]
  );

  const keyExtractor = useCallback((item: InstalledApp) => item.packageName, []);

  if (Platform.OS !== 'android') {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Note text={Strings.apps.androidOnly} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search bar — sticky above list */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari aplikasi…"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={{
            height: 44,
            borderRadius: 12,
            paddingHorizontal: 14,
            fontFamily: Figtree.regular,
            fontSize: 14,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          }}
        />
      </View>

      {loading && (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <ActivityIndicator color={theme.accent} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: Figtree.regular,
              fontSize: 13,
              color: theme.textSecondary,
            }}
          >
            Memuat daftar aplikasi…
          </Text>
        </View>
      )}

      {!loading && loadError && (
        <View style={{ padding: 16 }}>
          <Note text="Gagal memuat daftar aplikasi. Coba restart aplikasi." />
        </View>
      )}

      {!loading && !loadError && (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
          ListHeaderComponent={
            <Note text={Strings.apps.intro} />
          }
          ListEmptyComponent={
            <Note text={search ? 'Tidak ada aplikasi yang cocok.' : Strings.apps.empty} />
          }
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}
