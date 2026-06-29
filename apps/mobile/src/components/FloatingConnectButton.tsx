import { useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Animated, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConnectionStore } from '@/stores/connectionStore';
import { useProfileStore } from '@/stores/profileStore';

function BoltIcon({ color, size }: { color: string; size: number }) {
  return (
    <SymbolView
      name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
      tintColor={color}
      size={size}
      style={{ width: size, height: size }}
    />
  );
}

// ─── main button ───────────────────────────────────────────

const BTN_SIZE = 58;

export function FloatingConnectButton() {
  const conn = useConnectionStore();
  const profiles = useProfileStore((s) => s.profiles);
  const connect = useConnectionStore((s) => s.connect);
  const disconnect = useConnectionStore((s) => s.disconnect);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for connected/connecting states
  useEffect(() => {
    if (conn.status === 'connected') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    if (conn.status === 'connecting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulseAnim.setValue(1);
  }, [conn.status, pulseAnim]);

  const handlePress = useCallback(async () => {
    if (conn.status === 'connected' || conn.status === 'disconnecting') {
      disconnect();
    } else if (conn.status === 'disconnected') {
      const target = profiles.find((p) => p.id === id) || conn.profile || profiles[0];
      if (target) {
        await connect(target);
        router.push(`/servers/connection/${target.id}`);
      }
    }
  }, [conn.status, conn.profile, connect, disconnect, profiles, id, router]);

  const isConnected = conn.status === 'connected';
  const isConnecting = conn.status === 'connecting';
  const isDisconnected = conn.status === 'disconnected';

  const btnColor = isConnected || isConnecting ? '#FFF8D6' : '#F2F2F7';
  const iconColor = isConnected || isConnecting ? '#ffcc00' : '#8e8e93';
  const ringColor = isConnected ? '#00C781' : '#ff9f0a';
  const labelText = isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING' : 'TAP TO CONNECT';
  const labelColor = isConnected ? '#00C781' : isConnecting ? '#ff9f0a' : '#8e8e93';

  return (
    <View pointerEvents="box-none" style={{ alignItems: 'center', gap: 0 }}>
      {/* Pulse ring — only for connected/connecting */}
      {(isConnected || isConnecting) && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -10,
            width: BTN_SIZE + 20,
            height: BTN_SIZE + 20,
            borderRadius: (BTN_SIZE + 20) / 2,
            borderWidth: 2.5,
            borderColor: ringColor,
            opacity: pulseAnim.interpolate({
              inputRange: [1, isConnected ? 1.08 : 1.04],
              outputRange: [0.4, 0],
            }),
            transform: [{ scale: pulseAnim }],
          }}
        />
      )}

      {/* Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({
            width: BTN_SIZE,
            height: BTN_SIZE,
            borderRadius: BTN_SIZE / 2,
            backgroundColor: btnColor,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            borderWidth: isDisconnected ? 2 : 0,
            borderColor: isDisconnected ? '#C7C7CC' : undefined,
            shadowColor: isConnected || isConnecting ? '#ffcc00' : '#00C781',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isConnected ? 0.45 : isConnecting ? 0.3 : 0.12,
            shadowRadius: isConnected ? 12 : 8,
            elevation: 6,
          })}
        >
          <BoltIcon color={iconColor} size={28} />
        </Pressable>
      </Animated.View>

      {/* Label */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: labelColor,
          marginTop: 6,
          letterSpacing: 0.5,
        }}
      >
        {labelText}
      </Text>
    </View>
  );
}
