// Connection store — real WireGuard integration
// Manages VPN lifecycle: fetch config → parse → connect → heartbeat → disconnect

import { create } from 'zustand'
import type { VpnProfile, ConnectionStatus } from '@/types/vpn'
import { api } from '@/services/api'
import { vpnService } from '@/services/vpnService'
import { parseWireGuardConfig } from '@/utils/config-parser'
import { useSettingsStore } from '@/stores/settingsStore'
import { startHeartbeat, stopHeartbeat } from '@/services/heartbeatService'
import { getIpLocation, type UserLocation, DEFAULT_USER_LOCATION } from '@/services/geoLocationService'

import { diagnosticLogService } from '@/services/diagnosticLogService'

interface ConnectionState {
  profile: VpnProfile | null
  status: ConnectionStatus
  startTime: number | null
  elapsed: number
  bytesDownloaded: number
  bytesUploaded: number
  tunnelAddress: string[]
  tunnelDns: string[]
  error: string | null
  /** Tunnel was lost while connected and the kill switch is on (traffic blocked). */
  dropped: boolean
  /** Snapshot of client's real location & ISP IP before VPN tunnel connects. */
  clientSnapshot: UserLocation | null
  snapshotClientLocation: () => Promise<UserLocation | null>
  connect: (profile: VpnProfile) => Promise<void>
  disconnect: () => Promise<void>
  /** Poll the native tunnel; flags a drop if it died while we think we are connected. */
  checkTunnel: () => Promise<void>
  /** "Pakai internet tanpa VPN": release the kill switch and go back to idle. */
  releaseKillSwitch: () => Promise<void>
  tick: () => void
  updateStats: (down: number, up: number) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  profile: null,
  status: 'disconnected',
  startTime: null,
  elapsed: 0,
  bytesDownloaded: 0,
  bytesUploaded: 0,
  tunnelAddress: [],
  tunnelDns: [],
  error: null,
  dropped: false,
  clientSnapshot: null,

  snapshotClientLocation: async () => {
    if (get().status === 'disconnected') {
      try {
        const fresh = await getIpLocation()
        if (fresh) {
          set({ clientSnapshot: fresh })
          useSettingsStore.getState().update('lastKnownLocation', fresh)
          return fresh
        }
      } catch {
        // ignore error
      }
    }
    if (get().clientSnapshot) return get().clientSnapshot
    const saved = useSettingsStore.getState().lastKnownLocation
    if (saved) {
      const loc: UserLocation = {
        lat: saved.lat,
        lng: saved.lng,
        country: saved.country,
        city: saved.city,
        ip: saved.ip,
      }
      set({ clientSnapshot: loc })
      return loc
    }
    set({ clientSnapshot: DEFAULT_USER_LOCATION })
    return DEFAULT_USER_LOCATION
  },
  connect: async (profile) => {
    set({ status: 'connecting', profile, error: null, dropped: false })
    void diagnosticLogService.recordLog({
      level: 'INFO',
      stage: 'CONFIG',
      serverName: profile.name,
      serverHost: profile.serverAddress || profile.serverIp || 'unknown',
      summary: 'Memulai koneksi terowongan WireGuard',
    })
    // Ensure client's real IP and location are snapshotted before tunnel is active
    if (!get().clientSnapshot) {
      await get().snapshotClientLocation().catch(() => {})
    }


    // ponytail: only WireGuard supported for now
    if (profile.protocol !== 'wireguard') {
      void diagnosticLogService.recordLog({
        level: 'ERROR',
        stage: 'CONFIG',
        serverName: profile.name,
        serverHost: profile.serverAddress || profile.serverIp || 'unknown',
        summary: 'Protokol tidak didukung',
        details: 'Hanya WireGuard yang didukung oleh client saat ini',
      })
      set({
        status: 'disconnected',
        error: `OpenVPN not yet supported — use a WireGuard server`,
      })
      return
    }

    try {
      // 1. Fetch config from API
      const configRes = await api.getProfileConfig(profile.id)

      // 2. Parse WireGuard .conf
      const wgConfig = parseWireGuardConfig(configRes.config)
      const tunnelAddress = Array.isArray(wgConfig.address) ? wgConfig.address : wgConfig.address ? [wgConfig.address] : []

      // 3. Initialize VPN module
      await vpnService.initialize()

      // 4. Connect, passing whitelisted apps as excluded apps for split tunneling
      const { whitelistedApps } = useSettingsStore.getState()
      const excludedApps = whitelistedApps.map((a) => a.packageName)
      await vpnService.connect({ ...wgConfig, excludedApps })

      // 5. Connected
      set({ status: 'connected', startTime: Date.now(), elapsed: 0, tunnelAddress, tunnelDns: wgConfig.dns ?? [] })
      void diagnosticLogService.recordLog({
        level: 'SUCCESS',
        stage: 'TUNNEL_UP',
        serverName: profile.name,
        serverHost: profile.serverAddress || profile.serverIp || 'unknown',
        summary: 'Terowongan WireGuard aktif & terhubung',
        details: `IP Terowongan: ${tunnelAddress.join(', ') || '10.64.0.1'} · DNS: ${(wgConfig.dns ?? []).join(', ') || 'Default'}`,
      })

      // 6. Start heartbeat
      startHeartbeat(profile.id)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Connection failed'
      set({ status: 'disconnected', error: msg })
      void diagnosticLogService.recordLog({
        level: 'ERROR',
        stage: 'HANDSHAKE',
        serverName: profile.name,
        serverHost: profile.serverAddress || profile.serverIp || 'unknown',
        summary: 'Gagal terhubung ke server',
        details: msg,
      })
    }
  },

  disconnect: async () => {
    const prev = get().profile
    if (prev) {
      void diagnosticLogService.recordLog({
        level: 'INFO',
        stage: 'DISCONNECT',
        serverName: prev.name,
        serverHost: prev.serverAddress || prev.serverIp || 'unknown',
        summary: 'Terowongan WireGuard diputuskan',
        details: `Durasi aktif: ${get().elapsed}s · Upload: ${get().bytesUploaded} bytes · Download: ${get().bytesDownloaded} bytes`,
      })
    }
    set({ status: 'disconnecting', tunnelAddress: [], tunnelDns: [] })

    try {
      await vpnService.disconnect()
    } catch {
      // Silently clean up anyway
    }

    stopHeartbeat()
    set({
      status: 'disconnected',
      profile: null,
      startTime: null,
      elapsed: 0,
      bytesDownloaded: 0,
      bytesUploaded: 0,
      tunnelAddress: [],
      tunnelDns: [],
      error: null,
      dropped: false,
    })
  },

  checkTunnel: async () => {
    if (get().status !== 'connected') return
    try {
      if ((await vpnService.getStatus()).isConnected) return
    } catch {
      return // can't tell — don't report a drop we can't confirm
    }
    if (get().status !== 'connected') return
    stopHeartbeat()
    if (!useSettingsStore.getState().killSwitch) {
      get().reset()
      return
    }
    // keep `profile` so "Sambungkan lagi" knows where to reconnect
    set({ status: 'disconnected', dropped: true, startTime: null, elapsed: 0, tunnelAddress: [], tunnelDns: [] })
    void diagnosticLogService.recordLog({
      level: 'WARN',
      stage: 'DISCONNECT',
      serverName: get().profile?.name ?? 'Server',
      serverHost: get().profile?.serverAddress ?? 'unknown',
      summary: 'Koneksi terowongan terputus tiba-tiba',
      details: 'Kill switch aktif — menghentikan internet sementara untuk perlindungan',
    })
  },

  releaseKillSwitch: async () => {
    try {
      await vpnService.disconnect()
    } catch {
      // clean up anyway
    }
    get().reset()
    set({ profile: null })
  },

  tick: async () => {
    const { status, startTime } = get()
    if (status === 'connected' && startTime) {
      set({ elapsed: Math.floor((Date.now() - startTime) / 1000) })
    }
  },

  updateStats: (down, up) => {
    set({ bytesDownloaded: down, bytesUploaded: up })
  },

  reset: () => {
    stopHeartbeat()
    set({
      status: 'disconnected',
      startTime: null,
      elapsed: 0,
      bytesDownloaded: 0,
      bytesUploaded: 0,
      tunnelAddress: [],
      tunnelDns: [],
      error: null,
      dropped: false,
    })
  },
}))
