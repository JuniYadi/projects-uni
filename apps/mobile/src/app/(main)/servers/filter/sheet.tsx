import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button } from '@expo/ui';
import { useProfileStore } from '@/stores/profileStore';

function ChipGroup({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase">{label}</Text>
      <View className="flex-row flex-wrap gap-1">
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
    <View className="flex-1 p-6 gap-6 bg-white dark:bg-black">
      {/* Header */}
      <View className="flex-row gap-2 items-center">
        <Text className="text-xl font-bold flex-1 text-black dark:text-white">Filter</Text>
        <Host>
          <Button variant="text" onPress={resetFilter} label="Reset" />
        </Host>
      </View>

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
        label="Connection Status"
        options={[
          { value: 'all', label: 'All' },
          { value: 'connected', label: 'Connected (active)' },
        ]}
        selected={activeFilter.status}
        onSelect={(v) => setFilter({ status: v as any })}
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

      <View className="flex-1" />

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
