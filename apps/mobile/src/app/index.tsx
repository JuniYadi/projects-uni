import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthGate() {
  const status = useAuthStore((s) => s.status);

  // Only renders after root layout resolves auth + hides native splash
  if (status === 'valid') return <Redirect href="/(main)/servers" />;
  return <Redirect href="/(auth)/login" />;
}
