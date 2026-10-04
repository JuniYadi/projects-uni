
import { Stack } from 'expo-router/stack';
import { Strings } from '@/constants/strings';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const accentColor = isDark ? Colors.dark.accent : Colors.light.accent;

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor },
        headerStyle: { backgroundColor },
        headerTitleStyle: { color: textColor },
        headerTintColor: accentColor,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ title: Strings.settings.title }} />
      <Stack.Screen name="whitelist" options={{ title: Strings.settings.pickApps, headerLargeTitle: false }} />
      <Stack.Screen name="akun" options={{ title: Strings.account.title, headerLargeTitle: false }} />
      <Stack.Screen name="lanjutan" options={{ title: Strings.settings.advanced, headerLargeTitle: false }} />
      <Stack.Screen name="detail-koneksi" options={{ title: Strings.detail.title, headerLargeTitle: false }} />
    </Stack>
  );
}
