import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Button, TextInput, useNativeState } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';

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
        <Host style={{ width: '100%', paddingVertical: 12 }}>
          <Button variant="outlined" onPress={() => {}} label="📷  Scan QR Code" />
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
          <Host
            style={{
              borderWidth: 1,
              borderColor: error ? '#ff3b30' : '#c6c6c8',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <TextInput
              value={subId}
              onChangeText={(v) => { 'worklet'; subId.value = v; setError(null); }}
              placeholder="Enter your subscription ID..."
            />
          </Host>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Connect button */}
        <Host style={{ width: '100%', paddingVertical: 12 }}>
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
  errorText: { color: '#ff3b30', fontSize: 12 },
  version: { fontSize: 12, color: '#c6c6c8', marginTop: 64 },
});
