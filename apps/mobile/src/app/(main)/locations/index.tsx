import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FleetMap from '@/components/fleet-map';
import { LocationFilterSheet } from '@/components/locations/location-filter-sheet';
import { LocationSkeleton } from '@/components/locations/location-skeleton';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
    <Text
      style={{
        fontFamily: Figtree.semibold,
        fontSize: 12,
        letterSpacing: 0.5,
        color: theme.textSecondary,
        marginTop: 14,
        marginBottom: 4,
        paddingHorizontal: 2,
      }}
    >
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
      <View style={{ gap: 2 }}>
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
      </View>
    );
  }

  const list = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {body}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
      {/* Top Header */}
      <View
        style={{
          height: 52,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text accessibilityRole="header" style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.text }}>
          {Strings.tabs.locations}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filterCount ? `${L.filter}, ${filterCount}` : L.filter}
          onPress={() => setFilterOpen(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 18,
            backgroundColor: filterCount > 0 ? `${theme.accent}22` : theme.backgroundElement,
            borderWidth: 1,
            borderColor: filterCount > 0 ? theme.accent : theme.backgroundSelected,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="search" size={15} color={filterCount > 0 ? theme.accent : theme.textSecondary} />
          <Text
            style={{
              fontFamily: Figtree.medium,
              fontSize: 12,
              color: filterCount > 0 ? theme.accent : theme.textSecondary,
            }}
          >
            {filterCount > 0 ? `${L.filter} (${filterCount})` : L.filter}
          </Text>
        </Pressable>
      </View>

      {/* Measuring Status */}
      {pinging && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 6 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: `${theme.accent}44`,
              borderTopColor: theme.accent,
            }}
          />
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: Figtree.medium, fontSize: 13, color: theme.accent }}>
            {L.measuring}
          </Text>
        </View>
      )}
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
