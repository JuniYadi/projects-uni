import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthGate() {
  const [ready, setReady] = useState(false);
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore().then(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (status === 'valid') return <Redirect href="/(main)" />;
  return <Redirect href="/(auth)/login" />;
}
