import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SymbolView } from 'expo-symbols';
import { useAuthStore } from '@/stores/authStore';

export default function QrScanScreen() {
  const router = useRouter();
  const loginWithQr = useAuthStore((s) => s.loginWithQr);
  const authStatus = useAuthStore((s) => s.status);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    async (result: { data: string }) => {
      if (scanned || authStatus === 'loading') return;
      setScanned(true);

      try {
        await loginWithQr(result.data);
        router.replace('/(main)/servers');
      } catch {
        router.back();
      }
    },
    [scanned, authStatus, loginWithQr, router],
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-6">
        <SymbolView
          name={{ ios: 'camera.viewfinder', android: 'camera_alt', web: 'camera' }}
          tintColor="#8E8E93"
          size={48}
          style={{ width: 48, height: 48 }}
        />
        <Text className="text-center text-base text-white/70">
          Kamera diperlukan untuk memindai QR Code
        </Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-xl bg-[#208AEF] px-6 py-3 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">Izinkan Kamera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="py-2 active:opacity-60">
          <Text className="text-sm text-white/50">Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      {/* Overlay on top — CameraView doesn't support children */}
      <View className="absolute inset-0">
        {/* Top bar */}
        <View className="flex-row items-center px-4 pt-16">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40 active:opacity-60"
          >
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'x' }}
              tintColor="#FFFFFF"
              size={20}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
          <Text className="ml-3 text-lg font-semibold text-white">Scan QR Code</Text>
        </View>

        {/* Center guide */}
        <View className="flex-1 items-center justify-center">
          <View className="h-64 w-64 items-center justify-center rounded-2xl border-2 border-white/40">
            <SymbolView
              name={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr' }}
              tintColor="#FFFFFF"
              size={64}
              opacity={0.6}
              style={{ width: 64, height: 64 }}
            />
          </View>
          <Text className="mt-6 text-sm text-white/50">
            Arahkan kamera ke QR Code
          </Text>
        </View>

        {/* Bottom */}
        <View className="items-center pb-12">
          {authStatus === 'loading' && (
            <Text className="text-base text-white/70">Memverifikasi...</Text>
          )}
        </View>
      </View>
    </View>
  );
}
