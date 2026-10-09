import { NativeModule, requireNativeModule } from 'expo';

export type NativeStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'DISCONNECTING' | 'ERROR' | 'UNKNOWN';
export type TunnelState = 'ACTIVE' | 'INACTIVE' | 'CONNECTING' | 'DISCONNECTING' | 'ERROR' | 'UNKNOWN';

export interface WireGuardConfig {
  privateKey: string;
  publicKey: string;
  serverAddress: string;
  serverPort: number;
  address?: string | string[];
  allowedIPs: string[];
  dns?: string[];
  mtu?: number;
  presharedKey?: string;
  /** Apps that should bypass the VPN tunnel (split tunnel / whitelist). */
  excludedApps?: string[];
}

export interface WireGuardStatus {
  isConnected: boolean;
  tunnelState: TunnelState;
  status: NativeStatus;
  bytesReceived?: number;
  bytesSent?: number;
  error?: string;
}

export type WireGuardStatsEvent = {
  bytesReceived: number;
  bytesSent: number;
};

type UnivpnNativeEvents = {
  onStatsChanged(event: WireGuardStatsEvent): void;
};

declare class UnivpnNativeModule extends NativeModule<UnivpnNativeEvents> {
  initialize(): Promise<void>;
  requestVpnPermission(): Promise<boolean>;
  connect(config: WireGuardConfig): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<WireGuardStatus>;
  isSupported(): Promise<boolean>;
  /** Returns all user-visible installed apps sorted by name (Android only). */
  getInstalledApps(): Promise<Array<{ packageName: string; appName: string }>>;
  /** Returns app icon as base64-encoded PNG string, or null if not found (Android only). */
  getAppIcon(packageName: string): Promise<string | null>;
}

export default requireNativeModule<UnivpnNativeModule>('UnivpnNative');
