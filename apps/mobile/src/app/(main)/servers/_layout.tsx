import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router/stack';
import { Colors } from '@/constants/theme';

export default function ServersLayout() {
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
          contentStyle: { backgroundColor },
          title: 'Filter',
        }}
      />
    </Stack>
  );
}
