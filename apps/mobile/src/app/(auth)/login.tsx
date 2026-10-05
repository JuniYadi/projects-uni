import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { WelcomeMap } from '@/components/WelcomeMap';
import { authErrorText, Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { Motion } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';
import { routeAfterLogin } from '@/utils/post-login';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const reduced = useReducedMotion();
  const loginWithSubId = useAuthStore((s) => s.loginWithSubId);
  const [subId, setSubId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mapDone, setMapDone] = useState(false);
  const onMapDone = useCallback(() => setMapDone(true), []);

  const handleConnect = useCallback(async () => {
    const val = subId.trim();
    if (val.length < 3 || busy) return;
    setBusy(true);
    try {
      await loginWithSubId(val);
      router.replace(await routeAfterLogin());
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'SUBSCRIPTION_EXPIRED') router.replace('/(auth)/expired');
      else setError(authErrorText(code));
    } finally {
      setBusy(false);
    }
  }, [subId, busy, loginWithSubId, router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <WelcomeMap onDone={onMapDone} />
      <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 2 }}>
        <BrandLogo size={52} variant="neon" isDark={theme.isDark} />
      </View>
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 26, color: theme.text, textAlign: 'center' }}>
        {Strings.app.name}
      </Text>
      <Text style={{ fontFamily: Figtree.regular, fontSize: 15, color: theme.textSecondary, textAlign: 'center' }}>
        {Strings.auth.tagline}
      </Text>

      {mapDone && (
        <Animated.View entering={reduced ? undefined : FadeIn.duration(Motion.text)} style={{ gap: 12 }}>
          <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: theme.text }}>{Strings.auth.idLabel}</Text>
          <TextInput
            value={subId}
            onChangeText={(v) => {
              setSubId(v);
              setError(null);
            }}
            placeholder={Strings.auth.idPlaceholder}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={Strings.auth.idLabel}
            autoCapitalize="characters"
            autoCorrect={false}
            style={{
              minHeight: 48,
              paddingHorizontal: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: error ? theme.error : theme.backgroundSelected,
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              fontFamily: Figtree.regular,
              fontSize: 16,
            }}
          />
          {error && (
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: Figtree.regular, fontSize: 13, color: theme.error }}>
              {error}
            </Text>
          )}
          <Button
            label={busy ? Strings.auth.connecting : Strings.auth.continue}
            disabled={busy || subId.trim().length < 3}
            onPress={handleConnect}
          />
          {Platform.OS !== 'web' && (
            <Button variant="secondary" label={Strings.auth.scanQr} onPress={() => router.push('/qr-scan')} />
          )}
          <Pressable
            accessibilityRole="link"
            onPress={() => WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_APP_URL || '')}
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: Figtree.regular, fontSize: 14, color: theme.textSecondary }}>
              {Strings.auth.getOne}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}
