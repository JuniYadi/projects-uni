import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { vpnService } from '@/services/vpnService';
import * as storage from '@/services/storageService';

/** Android only, shown once after the first login: explains the system VPN dialog before it appears. */
export default function VpnPermissionScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleAllow = async () => {
    await vpnService.requestVpnPermission(); // shows the system dialog if not granted yet
    await storage.setVpnPermissionSeen();
    router.replace('/(main)/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24, gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="shield" color={theme.accent} size={72} />
      </View>
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 22, color: theme.text, textAlign: 'center' }}>
        {Strings.vpnPermission.title}
      </Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 15, color: theme.textSecondary, textAlign: 'center' }}>
        {Strings.vpnPermission.body}
      </Text>
      <Button label={Strings.vpnPermission.allow} onPress={handleAllow} />
    </View>
  );
}
