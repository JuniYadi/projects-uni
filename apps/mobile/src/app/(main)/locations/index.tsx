import { Text, View } from 'react-native';
import { Strings } from '@/constants/strings';
import { useTheme } from '@/hooks/use-theme';

// Stub: real screen is built in its own sub-issue.
export default function LocationsScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.text }}>{Strings.tabs.locations}</Text>
    </View>
  );
}
