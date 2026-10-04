import { useEffect, useState } from 'react';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import FleetMap from '@/components/fleet-map';
import { Group, Note, Row, Screen } from '@/components/ui/list-row';
import { Strings } from '@/constants/strings';
import { getIpLocation, type UserLocation } from '@/services/geoLocationService';
import { useConnectionStore } from '@/stores/connectionStore';

const D = Strings.detail;

/** Hide the last two parts of an IPv4 address; anything else is shown as-is. */
function maskIp(ip: string): string {
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.•••.•••` : ip;
}

export default function ConnectionDetailScreen() {
  const { status, profile, tunnelDns } = useConnectionStore();
  const [me, setMe] = useState<UserLocation | null>(null);
  const [network, setNetwork] = useState<string>(D.unknown);
  const connected = status === 'connected' && !!profile;

  useEffect(() => {
    if (!connected) return;
    getIpLocation().then(setMe);
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

  return (
    <Screen>
      <FleetMap profiles={[profile]} activeProfileId={profile.id} userLocation={me} />
      <Group title={D.current}>
        <Row label={D.status} value={D.protected} />
        <Row label={D.location} value={profile.country} />
        <Row label={D.ip} value={me?.ip ? maskIp(me.ip) : D.unknown} />
        <Row label={D.network} value={network} last />
      </Group>
      <Group title={D.server}>
        <Row label={D.serverAddress} value={profile.serverAddress} />
        <Row label={D.dns} value={tunnelDns.join(', ') || D.unknown} last />
      </Group>
    </Screen>
  );
}
