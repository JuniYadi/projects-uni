import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';

/** Shown when the server revokes this device (DEVICE_REVOKED) — session is already cleared. */
export default function RevokedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24, gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="close" color={theme.error} size={72} />
      </View>
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 22, color: theme.text, textAlign: 'center' }}>
        {Strings.revoked.title}
      </Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 15, color: theme.textSecondary, textAlign: 'center' }}>
        {Strings.revoked.body}
      </Text>
      <Button
        label={Strings.revoked.signIn}
        onPress={() => {
          clearError();
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}
