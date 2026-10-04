import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_LOCATION_FILTER, type LocationFilter } from '@/utils/locations';

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: Figtree.medium, fontSize: 13, color: theme.textSecondary }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.value)}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: 22,
                justifyContent: 'center',
                backgroundColor: on ? theme.accent : theme.backgroundSelected,
              }}
            >
              <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: on ? '#0F172A' : theme.text }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function LocationFilterSheet({
  visible,
  onClose,
  filter,
  regions,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  filter: LocationFilter;
  regions: string[];
  onChange: (f: LocationFilter) => void;
}) {
  const theme = useTheme();
  const L = Strings.locations;
  return (
    <Sheet visible={visible} onClose={onClose} title={L.filter}>
      <Chips
        label={L.region}
        value={filter.region}
        onChange={(region) => onChange({ ...filter, region })}
        options={[{ value: 'all', label: L.regionAll }, ...regions.map((r) => ({ value: r, label: r }))]}
      />
      <Chips
        label={L.sort}
        value={filter.sortBy}
        onChange={(sortBy) => onChange({ ...filter, sortBy })}
        options={[
          { value: 'ping', label: L.sortPing },
          { value: 'name', label: L.sortName },
        ]}
      />
      <Chips
        label={L.show}
        value={filter.show}
        onChange={(show) => onChange({ ...filter, show })}
        options={[
          { value: 'all', label: L.showAll },
          { value: 'favorites', label: L.showFavorites },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <View style={{ flex: 1, borderRadius: 14, backgroundColor: theme.backgroundSelected }}>
          <Button
            variant="secondary"
            label={L.reset}
            onPress={() => onChange({ ...DEFAULT_LOCATION_FILTER, query: filter.query })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={Strings.actions.apply} onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}
