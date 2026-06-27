import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Column, Row, Text, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';
import { Spacing } from '@/constants/theme';

function ChipGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <Column spacing={8}>
      <Text textStyle={{ fontSize: 13, fontWeight: '600', color: '#636366' }}>{label}</Text>
      <Row spacing={4} style={{ flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Button
            key={o.value}
            variant={selected === o.value ? 'filled' : 'outlined'}
            onPress={() => onSelect(o.value)}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            {o.label}
          </Button>
        ))}
      </Row>
    </Column>
  );
}

export default function FilterSheet() {
  const router = useRouter();
  const { activeFilter, setFilter, resetFilter, regions } = useProfileStore();

  return (
    <Host style={{ width: '100%', height: '100%' }}>
      <Column spacing={Spacing.four} style={{ padding: Spacing.four, flex: 1 }}>
        {/* Header */}
        <Row spacing={8} alignment="center">
          <Text textStyle={{ fontSize: 20, fontWeight: '700', flex: 1 }}>Filter</Text>
          <Button variant="text" onPress={resetFilter}>Reset</Button>
        </Row>

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

        <Button
          variant="filled"
          onPress={() => router.back()}
          style={{ paddingVertical: 14 }}
        >
          Apply Filters
        </Button>
      </Column>
    </Host>
  );
}
