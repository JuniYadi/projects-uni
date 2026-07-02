import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/stores/profileStore';
import { useConnectionStore } from '@/stores/connectionStore';
import FleetMap from '@/components/fleet-map';
import { vpnService } from '@/services/vpnService';
import { formatBytes, formatDuration } from '@/utils/formatters';
import * as Cellular from 'expo-cellular';
import * as Network from 'expo-network';

// ─── shared UI primitives (matches settings, compact) ──────

function Divider() {
  return <View className="h-px bg-black/10 dark:bg-white/10 ml-4" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="px-1 pb-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
      {title}
    </Text>
  );
}

function InfoRow({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  return (
    <View className="flex-row items-center py-2.5 px-4">
      <Text className="flex-1 text-sm text-black dark:text-white" numberOfLines={1}>
        {label}
      </Text>
      <Text
        className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[55%] text-right"
        selectable={selectable}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── floating map overlays ─────────────────────────────────

function StatusBadge({
  connected,
  connecting,
  disconnecting,
}: {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
}) {
  const statusColor = connected ? '#00C781' : connecting ? '#ff9f0a' : '#8e8e93';
  const statusLabel = connected ? 'CONNECTED' : connecting ? 'CONNECTING' : disconnecting ? 'DISCONNECTING' : 'DISCONNECTED';
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!connecting) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [connecting, pulse]);

  return (
    <View className="bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
      </Animated.View>
      <Text className="text-[10px] font-bold text-white tracking-wider">{statusLabel}</Text>
    </View>
  );
}

function TimerOverlay({ serverName, elapsed }: { serverName: string; elapsed: number }) {
  return (
    <View className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
      <Text className="text-xs font-bold text-white" numberOfLines={1}>{serverName}</Text>
      <Text className="text-2xl font-light text-white tabular-nums tracking-wider mt-0.5">
        {formatDuration(elapsed)}
      </Text>
    </View>
  );
}

function SpeedOverlay({ downloaded, uploaded }: { downloaded: number; uploaded: number }) {
  return (
    <View className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl">
      <Text className="text-xs font-bold text-white text-right">▼ {formatBytes(downloaded)}</Text>
      <Text className="text-xs font-bold text-white text-right mt-1">▲ {formatBytes(uploaded)}</Text>
    </View>
  );
}

// ─── network info ──────────────────────────────────────────

function NetworkInfo() {
  const { type, isConnected, isInternetReachable } = Network.useNetworkState();
  const [ip, setIp] = useState<string | null>(null);
  const [carrierName, setCarrierName] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Cellular.CellularGeneration | null>(null);

  useEffect(() => {
    Network.getIpAddressAsync().then(setIp);
    Cellular.getCarrierNameAsync().then(setCarrierName);
    Cellular.getCellularGenerationAsync().then(setGeneration);
  }, [type]);

  const typeLabel =
    type === Network.NetworkStateType.WIFI ? 'Wi-Fi' :
    type === Network.NetworkStateType.CELLULAR ? 'Cellular' :
    type === Network.NetworkStateType.ETHERNET ? 'Ethernet' :
    type === Network.NetworkStateType.BLUETOOTH ? 'Bluetooth' :
    type === Network.NetworkStateType.VPN ? 'VPN' :
    type === Network.NetworkStateType.NONE ? 'Disconnected' : 'Unknown';

  const internetLabel = isInternetReachable ? 'Reachable' : isConnected ? 'No access' : 'Offline';

  const genLabel =
    generation === Cellular.CellularGeneration.CELLULAR_5G ? '5G' :
    generation === Cellular.CellularGeneration.CELLULAR_4G ? '4G LTE' :
    generation === Cellular.CellularGeneration.CELLULAR_3G ? '3G' :
    generation === Cellular.CellularGeneration.CELLULAR_2G ? '2G' : null;

  const networkValue = carrierName && genLabel ? `${carrierName} · ${genLabel}` : carrierName ?? genLabel ?? '—';

  return (
    <View className="gap-2">
      <SectionHeader title="Network Status" />
      <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
        <InfoRow label="Connection" value={typeLabel} />
        <Divider />
        <InfoRow label="Internet" value={internetLabel} />
        <Divider />
        <InfoRow label="IP Address" value={ip && ip !== '0.0.0.0' ? ip : '—'} selectable />
        <Divider />
        <InfoRow label="Network" value={networkValue} />
      </View>
    </View>
  );
}

// ─── screen ────────────────────────────────────────────────

export default function ConnectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfileStore((s) => s.profiles.find((p) => p.id === id));
  const allProfiles = useProfileStore((s) => s.profiles);
  const status = useConnectionStore((s) => s.status);
  const connectionProfile = useConnectionStore((s) => s.profile);
  const elapsed = useConnectionStore((s) => s.elapsed);
  const bytesDownloaded = useConnectionStore((s) => s.bytesDownloaded);
  const bytesUploaded = useConnectionStore((s) => s.bytesUploaded);
  const tunnelAddress = useConnectionStore((s) => s.tunnelAddress);
  const tunnelDns = useConnectionStore((s) => s.tunnelDns);
  const connError = useConnectionStore((s) => s.error);

  const conn = { status, profile: connectionProfile, elapsed, bytesDownloaded, bytesUploaded, tunnelAddress, tunnelDns, error: connError };
  const isActive = conn.profile?.id === id;
  const connected = isActive && conn.status === 'connected';
  const connecting = isActive && conn.status === 'connecting';
  const disconnecting = isActive && conn.status === 'disconnecting';
  const tick = useConnectionStore((s) => s.tick);
  const updateStats = useConnectionStore((s) => s.updateStats);
  const setSelectedProfileId = useProfileStore((s) => s.setSelectedProfileId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remember this server as the user's chosen selection
  useEffect(() => {
    setSelectedProfileId(id);
  }, [id, setSelectedProfileId]);

  useEffect(() => {
    if (conn.status === 'connected' && !intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    }
    if (conn.status === 'disconnected' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [conn.status, tick]);

  useEffect(() => {
    if (!connected) return;
    return vpnService.onStatsChange((stats) => {
      updateStats(stats.bytesReceived, stats.bytesSent);
    });
  }, [connected, updateStats]);

  const insets = useSafeAreaInsets();

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-neutral-400">Server not found</Text>
      </View>
    );
  }

  const mapHeight = 280;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1">
        <View className="px-4 pt-3 gap-4" style={{ paddingBottom: insets.bottom + 80 }}>
          {/* Map with floating connection stats */}
          <View className="rounded-2xl overflow-hidden" style={{ height: mapHeight }}>
            <FleetMap
              profiles={allProfiles}
              activeProfileId={connected ? id : null}
              selectedProfileId={id}
              height={mapHeight}
            />

            <View className="absolute top-3 right-3 z-10" pointerEvents="box-none">
              <StatusBadge connected={connected} connecting={connecting} disconnecting={disconnecting} />
            </View>

            <View className="absolute bottom-3 left-3 z-10" pointerEvents="box-none">
              <TimerOverlay serverName={profile.name} elapsed={isActive ? conn.elapsed : 0} />
            </View>

            <View className="absolute bottom-3 right-3 z-10" pointerEvents="box-none">
              <SpeedOverlay downloaded={isActive ? conn.bytesDownloaded : 0} uploaded={isActive ? conn.bytesUploaded : 0} />
            </View>
          </View>

          {/* server info */}
          <View className="gap-2">
            <SectionHeader title="Server Information" />
            <View className="bg-black/5 dark:bg-white/10 rounded-2xl overflow-hidden">
              <InfoRow label="Server" value={profile.serverAddress} />
              <Divider />
              <InfoRow label="IP Server" value={profile.serverIp} />
              <Divider />
              <InfoRow label="IP Lokal" value={conn.tunnelAddress.join(', ') || 'Connect untuk lihat IP'} />
              <Divider />
              <InfoRow label="DNS" value={conn.tunnelDns.join(', ') || 'Connect untuk lihat DNS'} />
            </View>
          </View>

          {/* network status */}
          <NetworkInfo />

          {/* error */}
          {conn.error && (
            <View className="bg-red-500/10 rounded-xl px-4 py-3">
              <Text className="text-red-500 text-sm">{conn.error}</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
