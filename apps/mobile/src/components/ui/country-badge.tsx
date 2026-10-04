import { Text, View } from 'react-native';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Country code in a rounded square, replaces flag emoji. */
export function CountryBadge({ code }: { code: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 13, color: theme.text }}>
        {code.toUpperCase()}
      </Text>
    </View>
  );
}
