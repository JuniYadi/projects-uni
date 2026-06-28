import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button, TextInput, useNativeState } from '@expo/ui';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const loginWithSubId = useAuthStore((s) => s.loginWithSubId);
  const authStatus = useAuthStore((s) => s.status);
  const subId = useNativeState('');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    const val = subId.value?.trim();
    if (!val) return;
    setError(null);
    try {
      await loginWithSubId(val);
      router.replace('/(main)/servers');
    } catch {
      setError('Invalid subscription ID');
    }
  }, [subId, loginWithSubId, router]);

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.glow, { backgroundColor: colors.backgroundElement }]} />

        {/* Brand */}
        <View style={[styles.brandCard, { backgroundColor: colors.backgroundElement }]}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={[styles.title, { color: colors.text }]}>UniVPN</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Fast & Private</Text>
        </View>

        {/* QR scan button */}
        <Host style={styles.btnWrapper}>
          <Button variant="outlined" onPress={() => {}} label="📷  Scan QR Code" />
        </Host>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.backgroundElement }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.backgroundElement }]} />
        </View>

        {/* Sub ID Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>Subscription ID</Text>
          <Host style={[styles.inputHost, { borderColor: colors.backgroundElement }, error && styles.inputHostError]}>
            <TextInput
              value={subId}
              onChangeText={(v) => { 'worklet'; subId.value = v; }}
              placeholder="Enter your subscription ID..."
            />
          </Host>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Connect button */}
        <Host style={styles.btnWrapper}>
          <Button
            variant="filled"
            onPress={handleConnect}
            disabled={!subId.value?.trim() || authStatus === 'loading'}
            label={authStatus === 'loading' ? 'Connecting...' : 'Connect'}
          />
        </Host>

        {/* External link */}
        <Host>
          <Button variant="text" onPress={() => {}} label="↗️ Get one at our website" />
        </Host>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>─── v1.0.0 ───</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },
  glow: {
    position: 'absolute',
    top: -120,
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.14,
  },
  brandCard: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  logo: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  btnWrapper: { width: '100%', minHeight: 48 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14 },
  inputSection: { width: '100%', gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  inputHost: { borderWidth: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  inputHostError: { borderColor: '#ff3b30' },
  errorText: { color: '#ff3b30', fontSize: 12 },
  version: { fontSize: 12, marginTop: 48 },
});
