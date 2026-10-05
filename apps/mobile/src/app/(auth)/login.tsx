import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Icon } from '@/components/ui/icon';
import { WelcomeMap } from '@/components/WelcomeMap';
import { authErrorText, Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { Motion } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';
import { routeAfterLogin } from '@/utils/post-login';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  const accentTextColor = theme.isDark ? '#22C55E' : '#16A34A';
  const borderSubtle = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + (Platform.OS === 'web' ? 24 : 12),
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top: Flat map animation */}
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 16 }}>
          <WelcomeMap onDone={onMapDone} />
        </View>

        {/* Bottom: Form (fades in after map animation or immediately if reduced motion) */}
        {mapDone && (
          <Animated.View
            entering={reduced ? undefined : FadeIn.duration(Motion.text)}
            style={{ width: '100%', marginTop: 'auto', paddingTop: 20 }}
          >
            {/* Logo without name */}
            <View style={{ width: 44, height: 44, marginBottom: 12 }}>
              <BrandLogo size={44} variant="neon" isDark={theme.isDark} />
            </View>

            {/* Selamat datang */}
            <Text style={{ fontFamily: Figtree.semibold, fontSize: 22, color: theme.text }}>
              {Strings.auth.welcome}
            </Text>
            <Text
              style={{
                fontFamily: Figtree.regular,
                fontSize: 14,
                color: theme.textSecondary,
                marginTop: 2,
              }}
            >
              {Strings.auth.welcomeSubtitle}
            </Text>

            {/* ID Langganan Label */}
            <Text
              style={{
                fontFamily: Figtree.medium,
                fontSize: 13,
                color: theme.text,
                marginTop: 16,
              }}
            >
              {Strings.auth.idLabel}
            </Text>

            {/* Input with Key Icon */}
            <View
              style={{
                marginTop: 6,
                minHeight: 48,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: theme.backgroundElement,
                borderWidth: error ? 1.5 : 1,
                borderColor: error ? theme.error : borderSubtle,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Icon name="key" size={20} color={theme.textSecondary} />
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
                  flex: 1,
                  paddingVertical: 12,
                  fontFamily: Figtree.regular,
                  fontSize: 15,
                  color: theme.text,
                  letterSpacing: subId.length > 0 ? 0.6 : 0,
                }}
              />
            </View>

            {/* Error or Helper text */}
            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <Icon name="alert" size={16} color={theme.error} />
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ fontFamily: Figtree.regular, fontSize: 13, color: theme.error }}
                >
                  {error}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  fontFamily: Figtree.regular,
                  fontSize: 12,
                  color: theme.textSecondary,
                  marginTop: 8,
                }}
              >
                {Strings.auth.idHelper}
              </Text>
            )}

            {/* Button Masuk */}
            <View style={{ marginTop: 12 }}>
              <Button
                label={busy ? Strings.auth.connecting : Strings.auth.continue}
                disabled={busy || subId.trim().length < 3}
                onPress={handleConnect}
              />
            </View>

            {/* Pindai kode QR link */}
            {Platform.OS !== 'web' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={Strings.auth.scanQr}
                onPress={() => router.push('/(auth)/qr-scan')}
                style={{
                  marginTop: 14,
                  minHeight: 44,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Icon name="qr" size={18} color={accentTextColor} />
                <Text
                  style={{
                    fontFamily: Figtree.semibold,
                    fontSize: 14,
                    color: accentTextColor,
                  }}
                >
                  {Strings.auth.scanQr}
                </Text>
              </Pressable>
            )}

            {/* Belum punya ID? link */}
            <Pressable
              accessibilityRole="link"
              onPress={() => WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_APP_URL || '')}
              style={{ marginTop: 8, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: Figtree.regular, fontSize: 13, color: theme.textSecondary }}>
                {Strings.auth.getOne}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
