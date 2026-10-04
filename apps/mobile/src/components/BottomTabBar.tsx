import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { FloatingConnectButton } from './FloatingConnectButton';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const isLocations = pathname.startsWith('/(main)/locations') || pathname === '/(main)' || pathname === '/';
  const isSettings = pathname.startsWith('/(main)/settings');

  return (
    <View
      style={{
        paddingBottom: insets.bottom + 4,
        backgroundColor: c.background,
        borderTopWidth: 0.5,
        borderTopColor: c.backgroundSelected,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          paddingHorizontal: 24,
        }}
      >
        {/* Locations tab */}
        <Pressable
          onPress={() => router.replace('/(main)/locations')}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
        >
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, opacity: isLocations ? 1 : 0.5 }}>📍</Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: isLocations ? '#00C781' : '#8e8e93',
            }}
          >
            Lokasi
          </Text>
        </Pressable>

        {/* Center spacer for floating button */}
        <View style={{ width: 100 }} />

        {/* Settings tab */}
        <Pressable
          onPress={() => router.replace('/(main)/settings')}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
        >
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, opacity: isSettings ? 1 : 0.5 }}>⚙️</Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: isSettings ? '#00C781' : '#8e8e93',
            }}
          >
            Settings
          </Text>
        </Pressable>
      </View>

      {/* Floating connect button sits above the bar */}
      <View
        style={{
          position: 'absolute',
          top: -44,
          alignSelf: 'center',
          zIndex: 100,
        }}
      >
        <FloatingConnectButton />
      </View>
    </View>
  );
}
