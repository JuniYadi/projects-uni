import '../global.css';

import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Stack } from 'expo-router/stack';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold } from '@expo-google-fonts/figtree';
import { vpnService } from '@/services/vpnService';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors } from '@/constants/theme';

import { stopHeartbeat } from '@/services/heartbeatService';

// Keep the native splash visible while we check auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const reset = useConnectionStore((s) => s.reset);
  const restore = useAuthStore((s) => s.restore);
  const loadSettings = useSettingsStore((s) => s.load);
  const theme = useSettingsStore((s) => s.theme);
  const [ready, setReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold });
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  // Auth check + settings restore + native splash management
  useEffect(() => {
    Promise.all([restore(), loadSettings()]).finally(() => {
      // Apply theme before the app becomes visible to avoid a theme flash.
      const savedTheme = useSettingsStore.getState().theme;
      const scheme = savedTheme === 'system' ? (Platform.OS === 'ios' ? null : 'unspecified') : savedTheme;
      setColorScheme(scheme as any);
      setReady(true);
      // Native splash stays visible until auth resolves — prevents double loading screens
      SplashScreen.hideAsync();
    });
  }, [restore, loadSettings]);

  // Apply theme override whenever the setting changes after initial launch
  useEffect(() => {
    if (!ready) return;
    setColorScheme(theme === 'system' ? (Platform.OS === 'ios' ? null : 'unspecified') : theme as any);
  }, [ready, theme]);

  // Subscribe to native state changes (VPN permission is asked on the (auth)/vpn-permission screen)
  useEffect(() => {
    if (!ready) return;
    const unsub = vpnService.onStatusChange((status) => {
      if (status === 'DISCONNECTED' || status === 'ERROR') {
        stopHeartbeat();
        reset();
      }
    });
    return unsub;
  }, [ready, reset]);

  // Don't render navigation until auth is resolved — native splash covers the wait
  if (!ready || !(fontsLoaded || fontError)) return null;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="_error" />
        </Stack>
      </ThemeProvider>
    </View>
  );
}
