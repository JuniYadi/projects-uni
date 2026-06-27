import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Column, Text, Button, TextInput, Row, useNativeState } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing } from '@/constants/theme';

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
    <Host style={{ width: '100%', height: '100%' }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Column spacing={Spacing.four} style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}>
          {/* Brand */}
          <Column spacing={4} style={{ alignItems: 'center' }}>
            <Text textStyle={{ fontSize: 48 }}>🛡️</Text>
            <Text textStyle={{ fontSize: 32, fontWeight: '700' }}>UniVPN</Text>
            <Text textStyle={{ fontSize: 16, color: '#636366' }}>Fast & Private</Text>
          </Column>

          {/* QR button */}
          <Button
            variant="outlined"
            onPress={() => {
              // ponytail: stub — expo-camera QR scanner
            }}
            style={{ alignSelf: 'stretch', paddingVertical: 12 }}
          >
            <Row spacing={8} alignment="center">
              <Text textStyle={{ fontSize: 16 }}>📷</Text>
              <Text textStyle={{ fontSize: 16 }}>Scan QR Code</Text>
            </Row>
          </Button>

          {/* Divider */}
          <Row spacing={8} alignment="center" style={{ alignSelf: 'stretch' }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#c6c6c8' }} />
            <Text textStyle={{ fontSize: 14, color: '#636366' }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#c6c6c8' }} />
          </Row>

          {/* Sub ID Input */}
          <Column spacing={8} style={{ alignSelf: 'stretch' }}>
            <Text textStyle={{ fontSize: 14, fontWeight: '600' }}>Subscription ID</Text>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
              <TextInput
                value={subId}
                onChangeText={(v) => { 'worklet'; subId.value = v; setError(null); }}
                placeholder="Enter your subscription ID..."
              />
            </View>
            {error && <Text textStyle={{ color: '#ff3b30', fontSize: 12 }}>{error}</Text>}
          </Column>

          {/* Connect */}
          <Button
            variant="filled"
            onPress={handleConnect}
            disabled={!subId.value?.trim() || authStatus === 'loading'}
            style={{ alignSelf: 'stretch', paddingVertical: 12, opacity: !subId.value?.trim() ? 0.5 : 1 }}
          >
            {authStatus === 'loading' ? 'Connecting...' : 'Connect'}
          </Button>

          {/* External link */}
          <Button variant="text" onPress={() => {}}>
            ↗️ Get one at our website
          </Button>

          {/* Version */}
          <Text textStyle={{ fontSize: 12, color: '#c6c6c8', textAlign: 'center' }} selectable>
            ─── v1.0.0 ───
          </Text>
        </Column>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#c6c6c8',
    borderRadius: 8,
    padding: 12,
  },
  inputError: { borderColor: '#ff3b30' },
});
