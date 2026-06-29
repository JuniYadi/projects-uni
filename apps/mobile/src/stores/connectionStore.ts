// Connection store — real WireGuard integration
// Manages VPN lifecycle: fetch config → parse → connect → heartbeat → disconnect

import { create } from 'zustand'
import type { VpnProfile, ConnectionStatus } from '@/types/vpn'
import { api } from '@/services/api'
import { vpnService } from '@/services/vpnService'
import { parseWireGuardConfig } from '@/utils/config-parser'
import { startHeartbeat, stopHeartbeat } from '@/services/heartbeatService'

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
  connect: (profile: VpnProfile) => Promise<void>
  disconnect: () => Promise<void>
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

  connect: async (profile) => {
    set({ status: 'connecting', profile, error: null })

    // ponytail: only WireGuard supported for now
    if (profile.protocol !== 'wireguard') {
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

      // 4. Connect
      await vpnService.connect(wgConfig)

      // 5. Connected
      set({ status: 'connected', startTime: Date.now(), elapsed: 0, tunnelAddress, tunnelDns: wgConfig.dns ?? [] })

      // 6. Start heartbeat
      startHeartbeat(profile.id)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Connection failed'
      set({ status: 'disconnected', error: msg })
    }
  },

  disconnect: async () => {
    const prev = get().profile
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
    })
  },

  tick: async () => {
    const { status, startTime } = get()
    if (status === 'connected' && startTime) {
      set({ elapsed: Math.floor((Date.now() - startTime) / 1000) })
      try {
        const s = await vpnService.getStatus()
        if (s.bytesReceived !== undefined || s.bytesSent !== undefined) {
          set({
            bytesDownloaded: s.bytesReceived ?? get().bytesDownloaded,
            bytesUploaded: s.bytesSent ?? get().bytesUploaded,
          })
        }
      } catch { /* stats best-effort */ }
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
    })
  },
}))
