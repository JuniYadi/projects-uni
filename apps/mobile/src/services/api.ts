// API client — fetch-based with interceptors
// Base: https://vpn.example.com/api/vpn/mobile

import { Platform } from 'react-native'
import * as Crypto from 'expo-crypto'
import * as Device from 'expo-device'
import { API_BASE_URL, API_TIMEOUT } from '@univpn/shared'
import * as storage from './storageService'
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  PairingClaimRequest,
  PairingClaimResponse,
  ProfilesResponse,
  ProfileConfigResponse,
  DeviceListResponse,
  UpdateDeviceNameRequest,
  AuthErrorCode,
  ApiErrorBody,
  OkResponse,
} from '@univpn/shared'

// ─── Error Mapping ────────────────────────────────────────

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  TOKEN_INVALID: 'Sesi berakhir — login ulang',
  SUBSCRIPTION_INVALID: 'ID tidak valid',
  SUBSCRIPTION_NOT_ACTIVE: 'Subscription belum aktif',
  SUBSCRIPTION_EXPIRED: 'Subscription kadaluarsa — perpanjang via web',
  DEVICE_REVOKED: 'Device di-revoke — hubungi admin',
  DEVICE_ALREADY_PAIRED: 'Device sudah dipairing — hubungi admin',
  DEVICE_LIMIT_REACHED: 'Maksimum perangkat tercapai — logout perangkat lain',
  PAIRING_TOKEN_USED: 'QR sudah digunakan',
  PAIRING_TOKEN_EXPIRED: 'QR sudah kedaluwarsa — generate ulang',
  PAIRING_TOKEN_INVALID: 'QR tidak valid',
  NOT_FOUND: 'Data tidak ditemukan',
  GONE: 'Fitur tidak tersedia — hubungi support',
  RATE_LIMITED: 'Terlalu banyak percobaan — tunggu {seconds} detik',
  CONFIG_DECRYPT_FAILED: 'Gagal membaca config server — coba server lain',
  INTERNAL_ERROR: 'Server error — coba lagi',
  NETWORK_ERROR: 'Network error — periksa koneksi',
}

// ponytail: exported for UI error display
export function getErrorMessage(code: AuthErrorCode, details?: Record<string, unknown>): string {
  let msg = ERROR_MESSAGES[code] ?? 'Terjadi kesalahan'
  if (code === 'RATE_LIMITED' && details?.retryAfter) {
    msg = msg.replace('{seconds}', String(details.retryAfter))
  }
  return msg
}

// ─── Fingerprint ─────────────────────────────────────────

let cachedFingerprint: string | null = null

async function getOrCreateFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint
  let fp = await storage.getFingerprint()
  if (!fp) {
    const raw = `${Platform.OS}-${Device.modelName}-${Date.now()}`
    fp = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw)
    await storage.setFingerprint(fp)
  }
  cachedFingerprint = fp
  return fp
}

async function getDeviceName(): Promise<string> {
  return `${Platform.OS} ${Device.modelName || 'Unknown'}`
}

// ─── API Client ───────────────────────────────────────────

class VpnApiClient {
  private baseUrl = API_BASE_URL
  private timeout = API_TIMEOUT

  private async request<T>(
    path: string,
    options: RequestInit & { retry?: number }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const token = await storage.getToken()
    const fingerprint = await getOrCreateFingerprint()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `UniVPN/1.0.0 ${Platform.OS}`,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(fingerprint && { 'X-Device-Fingerprint': fingerprint }),
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      // 401: clear token globally
      if (response.status === 401) {
        await storage.clearAll()
        // ponytail: event emitter deferred — store can subscribe
        return Promise.reject(new Error('TOKEN_INVALID'))
      }

      // 2xx: success
      if (response.ok) {
        return response.json()
      }

      // 4xx/5xx: parse error
      const body = await response.json().catch(() => ({})) as ApiErrorBody
      const code = body?.error?.code ?? 'INTERNAL_ERROR'
      const retryAfter = response.headers.get('Retry-After')

      if (response.status === 429 && retryAfter) {
        return Promise.reject(new Error('RATE_LIMITED')) as T
      }

      return Promise.reject(new Error(code))
    } catch (err) {
      clearTimeout(timeoutId)
      if ((err as Error).name === 'AbortError') {
        return Promise.reject(new Error('NETWORK_ERROR')) as T
      }
      throw err
    }
  }

  // ─── Auth ───────────────────────────────────────────

  async loginWithSubId(subId: string): Promise<AuthLoginResponse> {
    const fingerprint = await getOrCreateFingerprint()
    const deviceName = await getDeviceName()

    const body: AuthLoginRequest = {
      subscriptionId: subId,
      deviceName,
      deviceFingerprint: fingerprint,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
    }

    const res = await this.request<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    await storage.setToken(res.token)
    await storage.setExpiresAt(res.expiresAt)
    await storage.setSubscriptionId(subId)

    return res
  }

  async loginWithQr(pairingToken: string): Promise<AuthLoginResponse> {
    const fingerprint = await getOrCreateFingerprint()
    const deviceName = await getDeviceName()

    const body: PairingClaimRequest = {
      pairingToken,
      deviceName,
      deviceFingerprint: fingerprint,
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
    }

    const res = await this.request<PairingClaimResponse>('/pairing/claim', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    await storage.setToken(res.token)
    await storage.setExpiresAt(res.expiresAt)
    await storage.setSubscriptionId(res.subscription.id)

    return res
  }

  async logout(): Promise<void> {
    // ponytail: no backend logout endpoint — just clear local
    await storage.clearAll()
    cachedFingerprint = null
  }

  // ─── Profiles ────────────────────────────────────────

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

  // ─── Devices ────────────────────────────────────────

  async getDevices(): Promise<DeviceListResponse> {
    return this.request<DeviceListResponse>('/devices', { method: 'GET' })
  }

  async revokeDevice(deviceId: string): Promise<OkResponse> {
    return this.request<OkResponse>(`/devices/${deviceId}`, { method: 'DELETE' })
  }

  async renameDevice(deviceId: string, name: string): Promise<OkResponse> {
    return this.request<OkResponse>(`/devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ deviceName: name } as UpdateDeviceNameRequest),
    })
  }
}

// Singleton
export const api = new VpnApiClient()
export default api