import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ErrorScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: theme.background }}
    >
      <Text accessibilityRole="header" style={{ fontFamily: Figtree.semibold, fontSize: 20, color: theme.text }}>
        {Strings.error.title}
      </Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
        {Strings.error.message}
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
        <Button label={Strings.error.home} onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}
