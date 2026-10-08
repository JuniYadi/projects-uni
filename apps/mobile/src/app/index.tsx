import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { MapGrid } from '@/components/WelcomeMap';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Strings } from '@/constants/strings';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SPLASH_MS = 900;

export default function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const theme = useTheme();
  const [done, setDone] = useState(false);

  // Only renders after root layout resolves auth + hides native splash
  useEffect(() => {
    const t = setTimeout(() => setDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (done) return <Redirect href={status === 'valid' ? '/(main)/home' : status === 'revoked' ? '/(auth)/revoked' : '/(auth)/login'} />;
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0, right: 0 }}>
        <MapGrid height={320} />
      </View>
      <BrandLogo size={68} variant="neon" isDark={theme.isDark} />
      <Text style={{ fontFamily: Figtree.semibold, fontSize: 28, color: theme.text, marginTop: 12 }}>
        {Strings.app.name}
      </Text>
    </View>
  );
}
