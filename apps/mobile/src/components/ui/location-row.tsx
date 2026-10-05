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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginVertical: 4,
        borderRadius: 14,
        backgroundColor: theme.backgroundElement,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? theme.accent : theme.backgroundSelected,
      }}
    >
      <CountryBadge code={profile.countryCode} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>{profile.name}</Text>
        <Text style={{ fontFamily: Figtree.regular, fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
          {subtitle ?? latencyLabel(profile.ping)}
        </Text>
      </View>
      {selected && <Icon name="check" color={theme.accent} size={18} />}
      {onToggleFavorite && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Favorit"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onToggleFavorite}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="star" size={20} color={favorite ? theme.accent : theme.textSecondary} filled={favorite} />
        </Pressable>
      )}
    </Pressable>
  );
}
