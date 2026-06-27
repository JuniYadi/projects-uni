import { Stack } from 'expo-router/stack';
import { colors } from '@/theme/colors';
import { Platform } from 'react-native';

export default function ServersLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: colors.label },
        headerBlurEffect: 'none',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Servers',
          headerSearchBarOptions: { hideWhenScrolling: false, placeholder: 'Search servers...' },
        }}
      />
      <Stack.Screen
        name="connection/[id]"
        options={{ title: 'Connection', headerLargeTitle: false }}
      />
      <Stack.Screen
        name="filter/sheet"
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 0.85],
          contentStyle: { backgroundColor: 'transparent' },
          title: 'Filter',
        }}
      />
    </Stack>
  );
}
