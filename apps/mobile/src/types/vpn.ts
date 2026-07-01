export const VPN_PROTOCOL = {
  WIREGUARD: 'wireguard',
  OPENVPN: 'openvpn',
} as const;

export type VpnProtocol = (typeof VPN_PROTOCOL)[keyof typeof VPN_PROTOCOL];

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export interface VpnProfile {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  protocol: VpnProtocol;
  port: number;
  load: number;
  ping: number | null;
  encryption: string;
  serverAddress: string;
  serverIp: string;
  /** @default 0 — fleet map uses lookup by countryCode if unset */
  latitude?: number;
  longitude?: number;
}

export interface ConnectionInfo {
  profileId: string | null;
  status: ConnectionStatus;
  startTime: number | null;
  bytesDownloaded: number;
  bytesUploaded: number;
}

export interface FilterState {
  protocol: VpnProtocol | 'all';
  region: string | 'all';
  status: 'all' | 'connected';
  sortBy: 'name' | 'ping' | 'region';
}

export interface AppSettings {
  autoConnect: boolean;
  killSwitch: boolean;
  preferredProtocol: VpnProtocol | 'auto';
  dnsServer: 'default' | 'cloudflare' | 'google' | string;
}

export interface SubscriptionInfo {
  id: string;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt: string;
}

export interface AuthState {
  subscriptionId: string | null;
  token: string | null;
  deviceName: string | null;
  subscription: SubscriptionInfo | null;
}
