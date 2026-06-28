import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button, TextInput, useNativeState } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
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
      router.replace('/(main)');
    } catch {
      setError('Invalid subscription ID');
    }
  }, [subId, loginWithSubId, router]);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>UniVPN</Text>
          <Text style={styles.subtitle}>Fast & Private</Text>
        </View>

        {/* QR scan button */}
        <Host style={{ width: '100%' }}>
          <Button
            variant="outlined"
            onPress={() => {}}
            style={{ alignSelf: 'stretch', paddingVertical: 12 }}
          >
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>📷</Text>
              <Text style={{ fontSize: 16 }}>Scan QR Code</Text>
            </View>
          </Button>
        </Host>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sub ID Input */}
        <View style={{ width: '100%', gap: 8 }}>
          <Text style={styles.label}>Subscription ID</Text>
          <Host>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
              <TextInput
                value={subId}
                onChangeText={(v) => { 'worklet'; subId.value = v; setError(null); }}
                placeholder="Enter your subscription ID..."
              />
            </View>
          </Host>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Connect */}
        <Host style={{ width: '100%' }}>
          <Button
            variant="filled"
            onPress={handleConnect}
            disabled={!subId.value?.trim() || authStatus === 'loading'}
            style={{ alignSelf: 'stretch', paddingVertical: 12, opacity: !subId.value?.trim() ? 0.5 : 1 }}
          >
            {authStatus === 'loading' ? 'Connecting...' : 'Connect'}
          </Button>
        </Host>

        {/* External link */}
        <Host>
          <Button variant="text" onPress={() => {}}>
            ↗️ Get one at our website
          </Button>
        </Host>

        {/* Version */}
        <Text style={styles.version}>─── v1.0.0 ───</Text>
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
    gap: 16,
  },
  brand: { alignItems: 'center', gap: 4 },
  logo: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 16, color: '#636366' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#c6c6c8' },
  dividerText: { fontSize: 14, color: '#636366' },
  label: { fontSize: 14, fontWeight: '600' },
  inputWrapper: { borderWidth: 1, borderColor: '#c6c6c8', borderRadius: 8, padding: 12 },
  inputError: { borderColor: '#ff3b30' },
  errorText: { color: '#ff3b30', fontSize: 12 },
  version: { fontSize: 12, color: '#c6c6c8', marginTop: 64 },
});
