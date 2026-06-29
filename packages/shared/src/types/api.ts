// ─── Auth Error Codes ───────────────────────────────────────

export type AuthErrorCode =
  | "TOKEN_INVALID"
  | "SUBSCRIPTION_INVALID"
  | "SUBSCRIPTION_NOT_ACTIVE"
  | "SUBSCRIPTION_EXPIRED"
  | "DEVICE_REVOKED"
  | "DEVICE_ALREADY_PAIRED"
  | "DEVICE_LIMIT_REACHED"
  | "PAIRING_TOKEN_USED"
  | "PAIRING_TOKEN_EXPIRED"
  | "PAIRING_TOKEN_INVALID"
  | "NOT_FOUND"
  | "GONE"
  | "RATE_LIMITED"
  | "CONFIG_DECRYPT_FAILED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"

export interface ApiErrorBody {
  error: {
    code: AuthErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

// ─── Login (Subscription ID) ────────────────────────────────

export interface AuthLoginRequest {
  subscriptionId: string
  deviceName: string
  deviceFingerprint: string
  platform: string
  osVersion?: string
  appVersion?: string
}

// ─── QR Pairing ─────────────────────────────────────────────

export interface PairingClaimRequest {
  pairingToken: string
  deviceName: string
  deviceFingerprint: string
  platform: string
  osVersion?: string
  appVersion?: string
}

export interface PairingClaimResponse {
  deviceId: string
  token: string
  expiresAt: string
  subscription: SubscriptionInfo
  profiles: ProfileInfo[]
}

export type SessionTokenResponse = PairingClaimResponse
export type AuthLoginResponse = SessionTokenResponse

// ─── Profiles ───────────────────────────────────────────────

export interface ProfileInfo {
  id: string
  serverId?: string
  serverName: string
  hostname: string
  serverIp?: string | null
  protocol: "OPENVPN" | "WIREGUARD"
  region: string
  provisioningStatus: string
  country?: string
  pingMs?: number
  loadPercent?: number
}

export interface ProfilesResponse {
  profiles: ProfileInfo[]
}

// ─── Config ─────────────────────────────────────────────────

export interface ProfileConfigResponse {
  config: string
  format: "openvpn" | "wireguard" | "proxy"
  profileId: string
}

// ─── Subscription ───────────────────────────────────────────

export interface SubscriptionInfo {
  id: string
  status: string
  currentPeriodEnd: string
}

// ─── Devices ────────────────────────────────────────────────

export interface DeviceInfo {
  id: string
  deviceName: string
  platform: string
  osVersion: string | null
  subscriptionId: string
  status: string
  pairedVia: string
  lastSeenAt: string | null
  pairedAt: string
  revokedAt: string | null
  revokedReason: string | null
}

export interface DeviceListResponse {
  devices: DeviceInfo[]
}

export interface UpdateDeviceNameRequest {
  deviceName: string
}

// ─── Heartbeat ──────────────────────────────────────────────

export interface HeartbeatResponse {
  ok: boolean
}

// ─── Generic ────────────────────────────────────────────────

export interface OkResponse {
  ok: boolean
}
