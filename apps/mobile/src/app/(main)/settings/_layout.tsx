import { Stack } from 'expo-router/stack';
import { colors } from '@/theme/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.systemBackground },
        headerTitleStyle: { color: colors.label },
        headerTintColor: colors.systemBlue,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.systemBackground },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="whitelist"
        options={{
          headerShown: true,
          title: 'Whitelist',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
