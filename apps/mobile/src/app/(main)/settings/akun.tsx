import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Group, Row, Screen } from '@/components/ui/list-row';
import { Icon } from '@/components/ui/icon';
import { Strings } from '@/constants/strings';
import { maskSubscriptionId } from '@univpn/shared';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { subscriptionId, expiresAt, subscription, logout } = useAuthStore();
  const disconnect = useConnectionStore((s) => s.disconnect);
  const [confirm, setConfirm] = useState(false);
  const [devices, setDevices] = useState<number | null>(null);
  const [showId, setShowId] = useState(false);

  const expired = (expiresAt ? new Date(expiresAt) < new Date() : false) || (!!subscription && subscription.status !== 'active');

  useEffect(() => {
    api
      .getDevices()
      .then((r) => setDevices(r.devices.filter((d) => !d.revokedAt).length))
      .catch(() => setDevices(null));
  }, []);

  const signOut = async () => {
    setConfirm(false);
    await disconnect();
    await logout();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      {expired && (
        <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16, gap: 12 }}>
          <Text style={{ fontFamily: Figtree.semibold, fontSize: 18, color: theme.error }}>{Strings.account.expiredTitle}</Text>
          <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary }}>
            {Strings.account.expiredMessage}
          </Text>
          <Button label={Strings.account.switchAccount} onPress={() => setConfirm(true)} />
        </View>
      )}
      <Group>
        <Row
          label={Strings.account.subscriptionId}
          value={
            subscriptionId
              ? showId
                ? subscriptionId
                : maskSubscriptionId(subscriptionId)
              : Strings.account.unknown
          }
          right={
            subscriptionId ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showId ? 'Sembunyikan ID' : 'Tampilkan ID'}
                hitSlop={8}
                onPress={() => setShowId(!showId)}
                style={{ padding: 4 }}
              >
                <Icon name={showId ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null
          }
        />
        <Row label={Strings.account.subscription} value={expired ? Strings.account.expired : Strings.account.active} />
        <Row
          label={Strings.account.validUntil}
          value={expiresAt ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : Strings.account.unknown}
        />
        <Row
          label={Strings.account.devices}
          value={devices === null ? Strings.account.unknown : Strings.account.devicesCount(devices)}
          last
        />
      </Group>
      <Group>
        <Row label={Strings.actions.logout} destructive onPress={() => setConfirm(true)} last />
      </Group>
      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        title={Strings.account.logoutTitle}
        message={Strings.account.logoutMessage}
      >
        <Button label={Strings.actions.logout} onPress={signOut} />
        <Button label={Strings.actions.cancel} variant="secondary" onPress={() => setConfirm(false)} />
      </Dialog>
    </Screen>
  );
}
