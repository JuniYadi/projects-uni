import type { VpnStats, VpnStatus } from '@univpn/vpn-platform'
export type { VpnStats, VpnStatus }

export interface SubscriptionInfo {
  id: string
  status: string
  currentPeriodEnd: string
}

export interface ProfileInfo {
  id: string
  serverName: string
  hostname: string
  protocol: 'OPENVPN' | 'WIREGUARD'
  region: string
  country?: string
}

export interface ElectronAPI {
  platform: string

  login: (
    subscriptionId: string
  ) => Promise<{ ok: true; subscription: SubscriptionInfo } | { ok: false; error?: string }>
  logout: () => Promise<void>
  restore: () => Promise<{ ok: true; token: string; expiresAt: string; subscriptionId: string } | { ok: false }>

  getProfiles: () => Promise<{ ok: true; profiles: ProfileInfo[] } | { ok: false; error?: string }>
  connect: (profileId: string) => Promise<{ ok: true } | { ok: false; error?: string }>
  disconnect: () => Promise<{ ok: true } | { ok: false; error?: string }>
  status: () => Promise<{ status: VpnStatus; stats: VpnStats | null; profileId: string | null }>

  getSettings: () => Promise<{ theme?: 'light' | 'dark' | 'system' }>
  setSettings: (settings: { theme?: 'light' | 'dark' | 'system' }) => Promise<{ theme?: 'light' | 'dark' | 'system' }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
