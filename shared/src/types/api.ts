export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface SessionTokenResponse {
  token: string
  expiresAt: string
  subscription: SubscriptionInfo
  profiles: ProfileInfo[]
}

export interface ProfileInfo {
  id: string
  serverId?: string
  serverName: string
  hostname: string
  protocol: "OPENVPN" | "WIREGUARD"
  region: string
  provisioningStatus: string
  country?: string
  pingMs?: number
  loadPercent?: number
}

export interface SubscriptionInfo {
  id: string
  status: string
  currentPeriodEnd: string
}

export interface DeviceInfo {
  id: string
  deviceName: string
  platform: string
  osVersion?: string
  subscriptionId: string
  status: string
  pairedVia: string
  lastSeenAt: string
  pairedAt: string
}
