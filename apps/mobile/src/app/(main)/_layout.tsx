import { useColorScheme } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Colors } from '@/constants/theme';
import { Stack } from 'expo-router/stack';

// ponytail: Stack wraps NativeTabs so each tab's screens get proper
// header management via their own Stack navigator.
export default function MainLayout() {
  const scheme = useColorScheme();
  const c = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={c.background}
      indicatorColor={c.backgroundElement}
      labelStyle={{ selected: { color: c.text } }}
    >
      <NativeTabs.Trigger name="servers">
        <NativeTabs.Trigger.Label>Servers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shield.fill" md="shield" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
