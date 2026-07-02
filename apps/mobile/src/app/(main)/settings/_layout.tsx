import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router/stack';
import { Colors } from '@/constants/theme';

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
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="whitelist"
        options={{
          headerShown: true,
          title: 'Whitelist',
          presentation: 'card',
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
