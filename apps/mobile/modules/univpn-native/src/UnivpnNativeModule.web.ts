import { registerWebModule, NativeModule } from 'expo';
import type { WireGuardConfig, WireGuardStatus } from './UnivpnNativeModule';

class UnivpnNativeModule extends NativeModule<{}> {
  async initialize(): Promise<void> {}
  async connect(_config: WireGuardConfig): Promise<void> {}
  async disconnect(): Promise<void> {}
  async getStatus(): Promise<WireGuardStatus> {
    return { isConnected: false, tunnelState: 'INACTIVE', status: 'DISCONNECTED' };
  }
  async isSupported(): Promise<boolean> {
    return false;
  }
}

export default registerWebModule(UnivpnNativeModule, 'UnivpnNative');
