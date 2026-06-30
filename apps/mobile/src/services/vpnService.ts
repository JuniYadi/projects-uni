// VPN service — tiny wrapper over our local Expo native module.

import WireGuardVpnModule from '../../modules/univpn-native'
import type { WireGuardConfig } from '@univpn/shared'

type VpnState =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTING'
  | 'ERROR'
  | 'UNKNOWN'

type StatusCallback = (status: VpnState) => void
type StatsCallback = (stats: { bytesReceived: number; bytesSent: number }) => void

// ─── types from native module ────────────────────────────

export interface VpnConnectionStatus {
  isConnected: boolean
  tunnelState:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'CONNECTING'
    | 'DISCONNECTING'
    | 'ERROR'
    | 'UNKNOWN'
  status: VpnState
  bytesReceived?: number
  bytesSent?: number
}

class VpnService {
  private initialized = false

  /** Request VPN permission from the system (Android: VPN dialog, iOS: NEVPNManager). Call early. */
  async requestVpnPermission(): Promise<boolean> {
    try {
      return await WireGuardVpnModule.requestVpnPermission()
    } catch {
      return false
    }
  }

  /** Initialize the native VPN backend. Must be called once before connect. */
  async initialize(): Promise<void> {
    if (this.initialized) return
    await WireGuardVpnModule.initialize()
    this.initialized = true
  }

  /** Connect to VPN with parsed WireGuard config. */
  async connect(config: WireGuardConfig): Promise<void> {
    await this.ensureInitialized()
    await WireGuardVpnModule.connect(config)
  }

  /** Disconnect current VPN tunnel. */
  async disconnect(): Promise<void> {
    await WireGuardVpnModule.disconnect()
  }

  /** Get current connection status from native module. */
  async getStatus(): Promise<VpnConnectionStatus> {
    return WireGuardVpnModule.getStatus()
  }

  /** Check if WireGuard VPN is supported on this device. */
  async isSupported(): Promise<boolean> {
    return WireGuardVpnModule.isSupported()
  }

  /** Subscribe to VPN state changes. */
  onStatusChange(_cb: StatusCallback): () => void {
    // ponytail: only stats events are wired for now; status is still read by JS state.
    return () => {}
  }

  /** Subscribe to native-pushed byte stats. */
  onStatsChange(cb: StatsCallback): () => void {
    const sub = WireGuardVpnModule.addListener('onStatsChanged', cb)
    return () => sub.remove()
  }

  /** Clean up resources. */
  dispose(): void {
    this.initialized = false
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }
}

// Singleton
export const vpnService = new VpnService()
export default vpnService
