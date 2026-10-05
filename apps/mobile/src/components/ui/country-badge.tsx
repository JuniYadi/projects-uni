import { Text, View } from 'react-native';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Country code in a circular badge, replaces flag emoji. */
export function CountryBadge({ code, size = 36 }: { code: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: Figtree.semibold, fontSize: Math.round(size * 0.34), color: theme.textSecondary }}>
        {code.toUpperCase()}
      </Text>
    </View>
  );
}
