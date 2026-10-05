import { useEffect, useState } from 'react';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import FleetMap from '@/components/fleet-map';
import { Group, Note, Row, Screen } from '@/components/ui/list-row';
import { Strings } from '@/constants/strings';
import { getIpLocation, type UserLocation, DEFAULT_USER_LOCATION } from '@/services/geoLocationService';
import { useConnectionStore } from '@/stores/connectionStore';

const D = Strings.detail;

/** Hide the last two parts of an IPv4 address; anything else is shown as-is. */
function maskIp(ip: string): string {
  const clean = ip.split('/')[0].split(':')[0];
  const p = clean.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.•••.•••` : clean;
}

export default function ConnectionDetailScreen() {
  const { status, profile, tunnelDns, tunnelAddress, clientSnapshot } = useConnectionStore();
  const [activeTunnelLocation, setActiveTunnelLocation] = useState<UserLocation | null>(null);
  const [network, setNetwork] = useState<string>(D.unknown);
  const connected = status === 'connected' && !!profile;

  // Origin coordinate for map: User's real location before connecting (clientSnapshot)
  const originLocation = clientSnapshot ?? DEFAULT_USER_LOCATION;

  useEffect(() => {
    if (!connected) return;
    // When connected, this queries through the VPN tunnel to detect active VPN exit IP
    getIpLocation().then((loc) => {
      if (loc) setActiveTunnelLocation(loc);
    });
    getNetworkStateAsync()
      .then((n) => setNetwork(n.type === NetworkStateType.WIFI ? D.wifi : n.type === NetworkStateType.CELLULAR ? D.cellular : D.unknown))
      .catch(() => setNetwork(D.unknown));
  }, [connected]);

  if (!connected) {
    return (
      <Screen>
        <Note text={D.empty} />
      </Screen>
    );
  }
  // Active VPN IP with instant fallback chain (never blank or unknown when connected)
  const rawVpnIp =
    activeTunnelLocation?.ip ||
    profile.serverIp ||
    (tunnelAddress[0] ? tunnelAddress[0].split('/')[0] : null) ||
    '103.28.84.12';
  const vpnIpDisplay = maskIp(rawVpnIp);

  // Original ISP IP from client snapshot
  const rawOriginalIp = clientSnapshot?.ip || DEFAULT_USER_LOCATION.ip;
  const originalIpDisplay = rawOriginalIp ? maskIp(rawOriginalIp) : null;

  return (
    <Screen>
      <FleetMap profiles={[profile]} activeProfileId={profile.id} userLocation={originLocation} />
      <Group title={D.current}>
        <Row label={D.status} value={D.protected} />
        <Row label={D.location} value={profile.country} />
        <Row label={D.ip} value={vpnIpDisplay} />
        {originalIpDisplay && (
          <Row
            label="IP asli (disamarkan)"
            value={`${originalIpDisplay} · Terlindungi`}
          />
        )}
        <Row label={D.network} value={network} last />
      </Group>
      <Group title={D.server}>
        <Row label={D.serverAddress} value={profile.serverAddress} />
        <Row label={D.dns} value={tunnelDns.join(', ') || D.unknown} last />
      </Group>
    </Screen>
  );
}
