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
}

export interface WireGuardStatus {
  isConnected: boolean;
  tunnelState: TunnelState;
  status: NativeStatus;
  bytesReceived?: number;
  bytesSent?: number;
  error?: string;
}

declare class UnivpnNativeModule extends NativeModule<{}> {
  initialize(): Promise<void>;
  connect(config: WireGuardConfig): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<WireGuardStatus>;
  isSupported(): Promise<boolean>;
}

export default requireNativeModule<UnivpnNativeModule>('UnivpnNative');
