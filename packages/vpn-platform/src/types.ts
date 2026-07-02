export type VpnStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error'

export interface VpnStats {
  bytesSent: number
  bytesReceived: number
}

export interface VpnPlatformDriver {
  initialize(): Promise<void>
  connect(config: string): Promise<void>
  disconnect(): Promise<void>
  status(): Promise<VpnStatus>
  stats(): Promise<VpnStats | null>
}
