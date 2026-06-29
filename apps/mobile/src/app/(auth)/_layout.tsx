import { Stack } from 'expo-router/stack';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="qr-scan" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
