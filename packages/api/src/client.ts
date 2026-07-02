import {
  API_BASE_URL,
  API_TIMEOUT,
  type ApiErrorBody,
  type AuthErrorCode,
  type AuthLoginRequest,
  type AuthLoginResponse,
  type DeviceListResponse,
  type OkResponse,
  type PairingClaimRequest,
  type PairingClaimResponse,
  type ProfileConfigResponse,
  type ProfilesResponse,
  type UpdateDeviceNameRequest,
} from '@univpn/shared'
import type { AuthStorage } from './storage'

export interface DeviceContext {
  name: string
  fingerprint: string
  platform: string
  osVersion: string
  appVersion: string
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  TOKEN_INVALID: 'Sesi berakhir — login ulang',
  SUBSCRIPTION_INVALID: 'ID tidak valid',
  SUBSCRIPTION_NOT_ACTIVE: 'Subscription belum aktif',
  SUBSCRIPTION_EXPIRED: 'Subscription kadaluarsa — perpanjang via web',
  DEVICE_REVOKED: 'Device di-revoke — hubungi admin',
  DEVICE_ALREADY_PAIRED: 'Device sudah dipairing — hubungi admin',
  DEVICE_LIMIT_REACHED: 'Batas device tercapai',
  PAIRING_TOKEN_USED: 'Token QR sudah digunakan',
  PAIRING_TOKEN_EXPIRED: 'Token QR kadaluarsa',
  PAIRING_TOKEN_INVALID: 'Token QR tidak valid',
  NOT_FOUND: 'Data tidak ditemukan',
  GONE: 'Resource tidak tersedia',
  RATE_LIMITED: 'Terlalu banyak percobaan — coba lagi nanti',
  CONFIG_DECRYPT_FAILED: 'Gagal membaca konfigurasi VPN',
  INTERNAL_ERROR: 'Terjadi kesalahan server',
  NETWORK_ERROR: 'Gangguan jaringan',
}

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code as AuthErrorCode] ?? 'Terjadi kesalahan'
}

export interface VpnApiClientOptions {
  baseUrl?: string
  timeout?: number
  storage: AuthStorage
  device: DeviceContext | (() => DeviceContext | Promise<DeviceContext>)
}

export class VpnApiClient {
  private baseUrl: string
  private timeout: number
  private storage: AuthStorage
  private device: () => DeviceContext | Promise<DeviceContext>

  constructor(options: VpnApiClientOptions) {
    this.baseUrl = options.baseUrl ?? API_BASE_URL
    this.timeout = options.timeout ?? API_TIMEOUT
    this.storage = options.storage
    this.device = async () =>
      typeof options.device === 'function' ? options.device() : options.device
  }

  private async request<T>(
    path: string,
    options: RequestInit & { retry?: number } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const [token, fingerprint] = await Promise.all([
      this.storage.getToken(),
      this.storage.getFingerprint(),
    ])

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(fingerprint && { 'X-Device-Fingerprint': fingerprint }),
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        await this.storage.clearAll()
        return Promise.reject(new Error('TOKEN_INVALID'))
      }

      if (response.ok) {
        return response.json() as Promise<T>
      }

      const body = (await response.json().catch(() => ({}))) as ApiErrorBody
      const code = body?.error?.code ?? 'INTERNAL_ERROR'

      if (response.status === 429) {
        return Promise.reject(new Error('RATE_LIMITED'))
      }

      return Promise.reject(new Error(code))
    } catch (err) {
      clearTimeout(timeoutId)
      if ((err as Error).name === 'AbortError') {
        return Promise.reject(new Error('NETWORK_ERROR'))
      }
      return Promise.reject(new Error('NETWORK_ERROR'))
    }
  }

  private async buildDevicePayload(subscriptionId?: string): Promise<AuthLoginRequest | PairingClaimRequest> {
    const ctx = await this.device()
    const fingerprint = (await this.storage.getFingerprint()) || ctx.fingerprint
    return {
      deviceName: ctx.name,
      deviceFingerprint: fingerprint,
      platform: ctx.platform,
      osVersion: ctx.osVersion,
      appVersion: ctx.appVersion,
      ...(subscriptionId ? { subscriptionId } : {}),
    } as AuthLoginRequest | PairingClaimRequest
  }

  async loginWithSubId(subscriptionId: string): Promise<AuthLoginResponse> {
    const body = await this.buildDevicePayload(subscriptionId)
    const res = await this.request<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    await Promise.all([
      this.storage.setToken(res.token),
      this.storage.setExpiresAt(res.expiresAt),
      this.storage.setSubscriptionId(res.subscription.id),
    ])

    return res
  }

  async loginWithQr(pairingToken: string): Promise<PairingClaimResponse> {
    const ctx = await this.device()
    const body: PairingClaimRequest = {
      pairingToken,
      deviceName: ctx.name,
      deviceFingerprint: ctx.fingerprint,
      platform: ctx.platform,
      osVersion: ctx.osVersion,
      appVersion: ctx.appVersion,
    }

    const res = await this.request<PairingClaimResponse>('/pairing/claim', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    await Promise.all([
      this.storage.setToken(res.token),
      this.storage.setExpiresAt(res.expiresAt),
      this.storage.setSubscriptionId(res.subscription.id),
    ])

    return res
  }

  async logout(): Promise<void> {
    await this.storage.clearAll()
  }

  async getProfiles(): Promise<ProfilesResponse> {
    return this.request<ProfilesResponse>('/profiles', { method: 'GET' })
  }

  async getProfileConfig(profileId: string): Promise<ProfileConfigResponse> {
    return this.request<ProfileConfigResponse>(`/profiles/${profileId}/config`, {
      method: 'GET',
    })
  }

  async sendHeartbeat(profileId: string): Promise<OkResponse> {
    return this.request<OkResponse>(`/profiles/${profileId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async getDevices(): Promise<DeviceListResponse> {
    return this.request<DeviceListResponse>('/devices', { method: 'GET' })
  }

  async revokeDevice(deviceId: string): Promise<OkResponse> {
    return this.request<OkResponse>(`/devices/${deviceId}`, { method: 'DELETE' })
  }

  async renameDevice(deviceId: string, name: string): Promise<OkResponse> {
    const body: UpdateDeviceNameRequest = { deviceName: name }
    return this.request<OkResponse>(`/devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }
}

export function createApiClient(options: VpnApiClientOptions): VpnApiClient {
  return new VpnApiClient(options)
}
