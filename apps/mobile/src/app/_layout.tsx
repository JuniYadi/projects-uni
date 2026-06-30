import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useColorScheme } from 'react-native';
import { Host } from '@expo/ui';
import { vpnService } from '@/services/vpnService';
import { useConnectionStore } from '@/stores/connectionStore';
import { stopHeartbeat } from '@/services/heartbeatService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const reset = useConnectionStore((s) => s.reset);

  // Request VPN permission early (Android VPN dialog), subscribe to native state changes
  useEffect(() => {
    vpnService.requestVpnPermission().catch(() => {});

    const unsub = vpnService.onStatusChange((status) => {
      if (status === 'DISCONNECTED' || status === 'ERROR') {
        stopHeartbeat();
        reset();
      }
    });
    return unsub;
  }, [reset]);

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
