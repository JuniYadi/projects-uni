import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';

/** Shown when login / QR is rejected with SUBSCRIPTION_EXPIRED. */
export default function ExpiredScreen() {
  const router = useRouter();
  const theme = useTheme();
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24, gap: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <Icon name="star" color={theme.error} size={72} />
      </View>
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 22, color: theme.text, textAlign: 'center' }}>
        {Strings.expired.title}
      </Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 15, color: theme.textSecondary, textAlign: 'center' }}>
        {Strings.expired.body}
      </Text>
      <Button
        label={Strings.expired.renew}
        onPress={() => WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_APP_URL || '')}
      />
      <Button
        variant="secondary"
        label={Strings.expired.switchAccount}
        onPress={() => {
          clearError();
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}
