import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.logo}>🛡️</Text>
      <Text style={styles.title}>UniVPN</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

export default function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      restore().then(() => setChecked(true));
    }
  }, [checked]);

  if (!checked || status === 'idle' || status === 'loading') {
    return <LoadingScreen />;
  }
  if (status === 'valid') return <Redirect href="/(main)/servers" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logo: { fontSize: 48 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
});
