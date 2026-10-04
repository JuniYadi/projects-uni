import { Pressable, Text, View } from 'react-native';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { latencyLabel } from '@/constants/strings';
import type { VpnProfile } from '@/types/vpn';
import { CountryBadge } from './country-badge';
import { Icon } from './icon';

type Props = {
  profile: Pick<VpnProfile, 'name' | 'countryCode' | 'ping'>;
  selected?: boolean;
  favorite?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Replaces the speed label (e.g. while measuring). */
  subtitle?: string;
  onToggleFavorite?: () => void;
};

export function LocationRow({ profile, selected, favorite, onPress, onLongPress, subtitle, onToggleFavorite }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
    >
      <CountryBadge code={profile.countryCode} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>{profile.name}</Text>
        <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary }}>
          {subtitle ?? latencyLabel(profile.ping)}
        </Text>
      </View>
      {selected && <Icon name="check" color={theme.accent} size={20} />}
      {onToggleFavorite && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Favorit"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={onToggleFavorite}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="star" size={20} color={favorite ? theme.accent : theme.textSecondary} filled={favorite} />
        </Pressable>
      )}
    </Pressable>
  );
}
