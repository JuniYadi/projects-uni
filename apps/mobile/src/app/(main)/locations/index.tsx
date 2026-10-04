import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FleetMap from '@/components/fleet-map';
import { LocationFilterSheet } from '@/components/locations/location-filter-sheet';
import { LocationSkeleton } from '@/components/locations/location-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationRow } from '@/components/ui/location-row';
import { Sheet } from '@/components/ui/sheet';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useLocationPicker } from '@/hooks/use-location-picker';
import { useIsTablet } from '@/hooks/use-is-tablet';
import { useTheme } from '@/hooks/use-theme';
import { useConnectionStore } from '@/stores/connectionStore';
import { useProfileStore } from '@/stores/profileStore';
import type { VpnProfile } from '@/types/vpn';
import { DEFAULT_LOCATION_FILTER, activeFilterCount, filterLocations, recommended } from '@/utils/locations';

const L = Strings.locations;

export default function LocationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tablet = useIsTablet();

  const { locations, selectedId, favoriteIds, select, toggleFavorite } = useLocationPicker();
  const loading = useProfileStore((s) => s.loading);
  const error = useProfileStore((s) => s.error);
  const pinging = useProfileStore((s) => s.pinging);
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const cancelLoadProfiles = useProfileStore((s) => s.cancelLoadProfiles);
  const connect = useConnectionStore((s) => s.connect);
  const activeId = useConnectionStore((s) => s.profile?.id ?? null);

  const [filter, setFilter] = useState(DEFAULT_LOCATION_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<VpnProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfiles();
    return cancelLoadProfiles;
  }, [loadProfiles, cancelLoadProfiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  }, [loadProfiles]);

  const regions = useMemo(() => [...new Set(locations.map((p) => p.region))], [locations]);
  const visible = useMemo(() => filterLocations(locations, filter, favoriteIds), [locations, filter, favoriteIds]);
  const rec = useMemo(() => recommended(locations), [locations]);
  // Recommendation only on the unfiltered list; otherwise it would disagree with the user's own search.
  const showRec = rec && !filter.query && filter.region === 'all' && filter.show === 'all' && visible.some((p) => p.id === rec.id);
  const rest = showRec ? visible.filter((p) => p.id !== rec.id) : visible;
  const filterCount = activeFilterCount(filter);
  const selected = locations.find((p) => p.id === selectedId) ?? null;

  const connectTo = (p: VpnProfile) => {
    setMenuFor(null);
    select(p.id);
    connect(p);
    router.navigate('/(main)/home');
  };

  const row = (p: VpnProfile) => (
    <LocationRow
      key={p.id}
      profile={p}
      selected={p.id === selectedId}
      favorite={favoriteIds.includes(p.id)}
      subtitle={pinging && p.ping === null ? L.measuringRow : undefined}
      onPress={() => select(p.id)}
      onLongPress={() => setMenuFor(p)}
      onToggleFavorite={() => toggleFavorite(p.id)}
    />
  );

  const heading = (text: string) => (
    <Text style={{ fontFamily: Figtree.semibold, fontSize: 12, letterSpacing: 1, color: theme.textSecondary, marginTop: 12 }}>
      {text.toUpperCase()}
    </Text>
  );

  const message = (title: string, hint: string, action: { label: string; onPress: () => void }) => (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 16, color: theme.text, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>{hint}</Text>
      <View style={{ marginTop: 8, alignSelf: 'stretch', maxWidth: 280, width: '100%' }}>
        <Button label={action.label} onPress={action.onPress} />
      </View>
    </View>
  );

  let body;
  if (loading && locations.length === 0) {
    body = <LocationSkeleton />;
  } else if (error && locations.length === 0) {
    body = message(L.loadFailed, L.loadFailedHint, { label: Strings.actions.retry, onPress: loadProfiles });
  } else if (visible.length === 0) {
    const onlyFavorites = filter.show === 'favorites' && !filter.query && filter.region === 'all';
    body = message(onlyFavorites ? L.emptyFavorites : L.empty, L.emptyHint, {
      label: L.reset,
      onPress: () => setFilter(DEFAULT_LOCATION_FILTER),
    });
  } else {
    body = (
      <Card style={{ paddingVertical: 4 }}>
        {showRec && (
          <>
            {heading(L.recommended)}
            {row(rec)}
          </>
        )}
        {rest.length > 0 && (
          <>
            {heading(L.all)}
            {rest.map(row)}
          </>
        )}
      </Card>
    );
  }

  const list = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 8 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {pinging && (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: Figtree.medium, fontSize: 13, color: theme.accent }}>
          {L.measuring}
        </Text>
      )}
      {body}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        <Text accessibilityRole="header" style={{ fontFamily: Figtree.semibold, fontSize: 28, color: theme.text }}>
          {Strings.tabs.locations}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={filter.query}
            onChangeText={(query) => setFilter({ ...filter, query })}
            placeholder={L.search}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={L.search}
            autoCorrect={false}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 14,
              paddingHorizontal: 16,
              fontFamily: Figtree.regular,
              fontSize: 15,
              color: theme.text,
              backgroundColor: theme.backgroundElement,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filterCount ? `${L.filter}, ${filterCount}` : L.filter}
            onPress={() => setFilterOpen(true)}
            style={{
              minHeight: 48,
              paddingHorizontal: 16,
              borderRadius: 14,
              justifyContent: 'center',
              backgroundColor: filterCount ? theme.accentLight : theme.backgroundElement,
            }}
          >
            <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: filterCount ? theme.accentDark : theme.text }}>
              {filterCount ? `${L.filter} · ${filterCount}` : L.filter}
            </Text>
          </Pressable>
        </View>
      </View>

      {tablet ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>{list}</View>
          <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontFamily: Figtree.semibold, fontSize: 12, letterSpacing: 1, color: theme.textSecondary }}>
              {L.mapSummary.toUpperCase()}
            </Text>
            <Text style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.text }}>
              {selected ? selected.name : L.noneSelected}
            </Text>
            <FleetMap profiles={locations} activeProfileId={activeId} selectedProfileId={selectedId} height={320} />
          </View>
        </View>
      ) : (
        list
      )}

      <LocationFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filter={filter}
        regions={regions}
        onChange={setFilter}
      />
      <Sheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.name ?? ''}>
        {menuFor && (
          <View style={{ gap: 8 }}>
            <Button label={L.connect} onPress={() => connectTo(menuFor)} />
            <Button
              variant="secondary"
              label={favoriteIds.includes(menuFor.id) ? L.removeFavorite : L.addFavorite}
              onPress={() => {
                toggleFavorite(menuFor.id);
                setMenuFor(null);
              }}
            />
          </View>
        )}
      </Sheet>
    </View>
  );
}
