import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router/stack';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useColorScheme } from 'react-native';
import { Host } from '@expo/ui';
import * as SplashScreen from 'expo-splash-screen';
import { vpnService } from '@/services/vpnService';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { stopHeartbeat } from '@/services/heartbeatService';

// Keep the native splash visible while we check auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const reset = useConnectionStore((s) => s.reset);
  const restore = useAuthStore((s) => s.restore);
  const [ready, setReady] = useState(false);

  // Auth check + native splash management
  useEffect(() => {
    restore().finally(() => {
      setReady(true);
      // Native splash stays visible until auth resolves — prevents double loading screens
      SplashScreen.hideAsync();
    });
  }, [restore]);

  // Request VPN permission early (Android VPN dialog), subscribe to native state changes
  useEffect(() => {
    if (!ready) return;
    vpnService.requestVpnPermission().catch(() => {});

    const unsub = vpnService.onStatusChange((status) => {
      if (status === 'DISCONNECTED' || status === 'ERROR') {
        stopHeartbeat();
        reset();
      }
    });
    return unsub;
  }, [ready, reset]);

  // Don't render navigation until auth is resolved — native splash covers the wait
  if (!ready) return null;

  return (
    <Host style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="_error" />
        </Stack>
      </ThemeProvider>
    </Host>
  );
}
