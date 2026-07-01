export interface WireGuardConfig {
  privateKey: string
  publicKey: string
  serverAddress: string
  serverPort: number
  address?: string | string[]
  allowedIPs: string[]
  dns?: string[]
  mtu?: number
  presharedKey?: string
  /** Apps that should bypass the VPN tunnel (split tunnel / whitelist). */
  excludedApps?: string[]
}

export type VPNProtocol = "OPENVPN" | "WIREGUARD"

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error"

export interface ConnectionState {
  status: ConnectionStatus
  profileId: string | null
  startTime: Date | null
  elapsed: number
  bytesDownloaded: number
  bytesUploaded: number
  error?: string
}
