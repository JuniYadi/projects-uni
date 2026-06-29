import { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Host, Button } from '@expo/ui';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const loginWithSubId = useAuthStore((s) => s.loginWithSubId);
  const authStatus = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [subId, setSubId] = useState('');

  // ponytail: backend validates format — just check non-empty
  const isValidSubId = (v: string) => v.trim().length >= 3;

  const handleChangeText = useCallback(
    (v: string) => {
      setSubId(v);
      if (authError) clearError();
    },
    [authError, clearError],
  );

  const handleConnect = useCallback(async () => {
    const val = subId.trim();
    if (!val || !isValidSubId(val)) return;
    try {
      await loginWithSubId(val);
      router.replace('/(main)/servers');
    } catch {
      // handled by store
    }
  }, [subId, loginWithSubId, router]);

  const handleQrScan = useCallback(() => {
    router.push('/qr-scan');
  }, [router]);

  const [boltAnim, setBoltAnim] = useState({ opacity: 0, scale: 0.85 });

  useEffect(() => {
    let start = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const t = now - start;
      if (t < 500) {
        // Fade in + scale up
        const p = t / 500;
        setBoltAnim({ opacity: p, scale: 0.85 + 0.15 * p });
      } else {
        // Gentle pulse
        const cycle = (t - 500) % 3000;
        const phase = cycle < 1500 ? cycle / 1500 : 1 - (cycle - 1500) / 1500;
        setBoltAnim({ opacity: 1, scale: 1 + 0.05 * phase });
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Big bolt hero ─── */}
        <View className="items-center mb-12">
          <View style={{ opacity: boltAnim.opacity, transform: [{ scale: boltAnim.scale }] }}>
            <SymbolView
              name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
              tintColor="#ffcc00"
              size={72}
              style={{ width: 72, height: 72 }}
            />
          </View>
          <Text className="text-[30px] font-bold text-[#1C1C1E] tracking-tight mt-2">UniVPN</Text>
          <Text className="text-[15px] text-[#8E8E93] mt-0.5">Fast & Private</Text>
        </View>

        {/* ─── Form ─── */}
        <View className="gap-4">
          {/* Input */}
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-[#1C1C1E]">Subscription ID</Text>
            <TextInput
              value={subId}
              onChangeText={handleChangeText}
              placeholder="Enter your subscription ID..."
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor="#C7C7CC"
              className="px-4 py-4 text-base text-[#1C1C1E] rounded-xl bg-[#F2F2F7]"
              style={{
                borderWidth: 1,
                borderColor: authError ? '#FF3B30' : '#E5E5EA',
              }}
            />
            {authError && <Text className="text-xs text-[#FF3B30]">{authError}</Text>}
          </View>

          {/* Connect */}
          <Host style={{ width: '100%', minHeight: 48 }}>
            <Button
              variant="filled"
              onPress={handleConnect}
              disabled={!subId.trim() || !isValidSubId(subId) || authStatus === 'loading'}
              label={authStatus === 'loading' ? 'Connecting...' : 'Connect'}
            />
          </Host>

          {/* QR — visible secondary button */}
          <Pressable
            onPress={handleQrScan}
            className="flex-row items-center justify-center gap-2 py-3 active:opacity-60"
          >
            <SymbolView
              name={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr' }}
              tintColor="#8E8E93"
              size={18}
              style={{ width: 18, height: 18 }}
            />
            <Text className="text-sm font-medium text-[#8E8E93]">Scan QR Code</Text>
          </Pressable>
        </View>

        {/* Get one link */}
        <Pressable
          onPress={() => {
            import('expo-web-browser').then((m) =>
              m.openBrowserAsync('https://univpn.example.com/portal'),
            );
          }}
          className="flex-row items-center justify-center gap-1.5 mt-6 active:opacity-60"
        >
          <Text className="text-sm text-[#8E8E93]">Get one at our website</Text>
          <Text className="text-sm text-[#8E8E93]">↗</Text>
        </Pressable>

        <Text className="mt-12 text-center text-xs text-[#C7C7CC]">─── v1.0.0 ───</Text>
      </ScrollView>
    </View>
  );
}
