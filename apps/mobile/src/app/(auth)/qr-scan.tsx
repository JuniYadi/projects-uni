import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { Icon } from '@/components/ui/icon';
import { Figtree } from '@/constants/theme';
import { authErrorText, Strings } from '@/constants/strings';
import { routeAfterLogin } from '@/utils/post-login';

export default function QrScanScreen() {
  const router = useRouter();
  const loginWithQr = useAuthStore((s) => s.loginWithQr);
  const authStatus = useAuthStore((s) => s.status);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBarcodeScanned = useCallback(
    async (result: { data: string }) => {
      if (scanned || authStatus === 'loading') return;
      setScanned(true);

      try {
        await loginWithQr(result.data);
        if (router.canDismiss()) {
          router.dismissAll();
        }
        router.replace(await routeAfterLogin());
      } catch (err) {
        const code = (err as Error).message;
        if (code === 'SUBSCRIPTION_EXPIRED') return router.replace('/(auth)/expired');
        setError(authErrorText(code));
        setScanned(false); // allow another scan
      }
    },
    [scanned, authStatus, loginWithQr, router],
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#000000', paddingHorizontal: 24 }}>
        <Icon name="qr" color="#94A3B8" size={56} />
        <Text style={{ fontFamily: Figtree.regular, textAlign: 'center', fontSize: 15, color: 'rgba(255, 255, 255, 0.7)' }}>
          {Strings.auth.cameraNeeded}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={Strings.auth.allowCamera}
          onPress={requestPermission}
          style={{ minHeight: 48, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: Figtree.semibold, fontSize: 15, color: '#052E16' }}>{Strings.auth.allowCamera}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={Strings.auth.back} onPress={() => router.back()} style={{ paddingVertical: 8 }}>
          <Text style={{ fontFamily: Figtree.medium, fontSize: 14, color: 'rgba(255, 255, 255, 0.5)' }}>{Strings.auth.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      {/* Overlay on top of camera matching univpn-v2-final.html */}
      <View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'transparent',
          justifyContent: 'space-between',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            gap: 12,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevron-left" color="#FFFFFF" size={24} />
          </Pressable>
          <Text
            style={{
              fontFamily: Figtree.semibold,
              fontSize: 18,
              color: '#FFFFFF',
            }}
          >
            Pindai kode QR
          </Text>
        </View>

        {/* Center Viewfinder: 230x230 with 4 green corner brackets */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 230, height: 230, position: 'relative' }}>
            {/* Top-Left Corner */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 34,
                height: 34,
                borderTopWidth: 4,
                borderLeftWidth: 4,
                borderColor: '#22C55E',
                borderTopLeftRadius: 8,
              }}
            />
            {/* Top-Right Corner */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 34,
                height: 34,
                borderTopWidth: 4,
                borderRightWidth: 4,
                borderColor: '#22C55E',
                borderTopRightRadius: 8,
              }}
            />
            {/* Bottom-Left Corner */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 34,
                height: 34,
                borderBottomWidth: 4,
                borderLeftWidth: 4,
                borderColor: '#22C55E',
                borderBottomLeftRadius: 8,
              }}
            />
            {/* Bottom-Right Corner */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 34,
                height: 34,
                borderBottomWidth: 4,
                borderRightWidth: 4,
                borderColor: '#22C55E',
                borderBottomRightRadius: 8,
              }}
            />
          </View>

          <Text
            style={{
              fontFamily: Figtree.regular,
              fontSize: 14,
              color: '#E2E8F0',
              marginTop: 28,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            Arahkan kamera ke kode QR langgananmu
          </Text>

          {authStatus === 'loading' && (
            <Text
              style={{
                fontFamily: Figtree.medium,
                fontSize: 14,
                color: '#22C55E',
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {Strings.auth.qrChecking}
            </Text>
          )}

          {error && (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                fontFamily: Figtree.medium,
                fontSize: 14,
                color: '#F87171',
                marginTop: 12,
                textAlign: 'center',
                paddingHorizontal: 24,
              }}
            >
              {error}
            </Text>
          )}
        </View>

        {/* Bottom Action: Masukkan ID secara manual button */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Masukkan ID secara manual"
            onPress={() => router.back()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: Figtree.semibold,
                fontSize: 15,
                color: '#FFFFFF',
              }}
            >
              {Strings.auth.manualId}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
