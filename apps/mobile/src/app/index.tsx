import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    if (status === 'idle') {
      restore();
    }
  }, [status, restore]);

  if (status === 'idle') {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>UniVPN</Text></View>;
  }
  if (status === 'valid') return <Redirect href="/(main)" />;
  return <Redirect href="/(auth)/login" />;
}
