import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { Redirect } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useColorScheme } from 'react-native';
import { Host } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore();
  }, []);

  if (status === 'idle') return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (status === 'invalid' || status === 'expired') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Host style={{ width: '100%', height: '100%' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </Host>
    </ThemeProvider>
  );
}
