import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { TabBar, TabBarItem } from '@/components/ui/tab-bar';
import { useIsTablet } from '@/hooks/use-is-tablet';
import { Strings } from '@/constants/strings';

// Tabs are final: home / locations / settings. Screens live in (main)/<tab>/.
export default function MainLayout() {
  const tablet = useIsTablet();
  return (
    <Tabs style={{ flex: 1, flexDirection: tablet ? 'row' : 'column' }}>
      {tablet ? null : <TabSlot style={{ flex: 1 }} />}
      <TabList asChild>
        <TabBar>
          <TabTrigger name="home" href="/(main)/home" asChild>
            <TabBarItem label={Strings.tabs.home} icon="home" />
          </TabTrigger>
          <TabTrigger name="locations" href="/(main)/locations" asChild>
            <TabBarItem label={Strings.tabs.locations} icon="locations" />
          </TabTrigger>
          <TabTrigger name="settings" href="/(main)/settings" asChild>
            <TabBarItem label={Strings.tabs.settings} icon="settings" />
          </TabTrigger>
        </TabBar>
      </TabList>
      {tablet ? <TabSlot style={{ flex: 1 }} /> : null}
    </Tabs>
  );
}
