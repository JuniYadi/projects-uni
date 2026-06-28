import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { Spacing } from '@/constants/theme';

function ChipGroup({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {options.map((o) => (
          <Host key={o.value} matchContents style={{ minHeight: 36 }}>
            <Button
              variant={selected === o.value ? 'filled' : 'outlined'}
              onPress={() => onSelect(o.value)}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              label={o.label}
            />
          </Host>
        ))}
      </View>
    </View>
  );
}

export default function FilterSheet() {
  const router = useRouter();
  const { activeFilter, setFilter, resetFilter, regions } = useProfileStore();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text style={styles.title}>Filter</Text>
        <Host>
          <Button variant="text" onPress={resetFilter} label="Reset" />
        </Host>
      </View>

      <ChipGroup
        label="Protocol"
        options={[
          { value: 'all', label: 'All' },
          { value: 'openvpn', label: 'OpenVPN' },
          { value: 'wireguard', label: 'WireGuard' },
        ]}
        selected={activeFilter.protocol}
        onSelect={(v) => setFilter({ protocol: v as any })}
      />

      <ChipGroup
        label="Region"
        options={[
          { value: 'all', label: 'All' },
          ...regions.map((r) => ({ value: r, label: r })),
        ]}
        selected={activeFilter.region}
        onSelect={(v) => setFilter({ region: v as any })}
      />

      <ChipGroup
        label="Sort By"
        options={[
          { value: 'name', label: 'Name' },
          { value: 'ping', label: 'Ping' },
          { value: 'region', label: 'Region' },
        ]}
        selected={activeFilter.sortBy}
        onSelect={(v) => setFilter({ sortBy: v as any })}
      />

      <View style={{ flex: 1 }} />

      <Host style={{ width: '100%' }}>
        <Button
          variant="filled"
          onPress={() => router.back()}
          style={{ width: '100%', paddingVertical: 14 }}
          label="Apply Filters"
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four, flex: 1 },
  title: { fontSize: 20, fontWeight: '700', flex: 1 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: '#636366' },
});
