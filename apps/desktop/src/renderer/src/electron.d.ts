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
  serverIp?: string | null
  protocol: 'OPENVPN' | 'WIREGUARD'
  region: string
  country?: string
  pingMs?: number
  city?: string
}

export interface DesktopSettingsState {
  theme?: 'light' | 'dark' | 'system'
  lastProfileId?: string
  openAtLogin: boolean
  killSwitch: boolean
  autoConnect: boolean
  buttonStyle: 'cyber' | 'classic'
  favorites: string[]
  dnsServer?: 'default' | 'cloudflare' | 'google' | 'adguard' | string
}

export interface UpdateInfoState {
  currentVersion: string
  availableVersion?: string
  minSupportedVersion?: string
  mandatory?: boolean
  sunsetMessage?: string
  releaseNotes?: string
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'not-available' | 'error' | 'expired'
  progress?: number
  error?: string
}

export interface ElectronAPI {
  platform: string

  login: (
    subscriptionId: string
  ) => Promise<{ ok: true; subscription: SubscriptionInfo } | { ok: false; error?: string }>
  logout: () => Promise<void>
  onAuthLost: (callback: (code: 'TOKEN_INVALID' | 'DEVICE_REVOKED') => void) => () => void
  restore: () => Promise<{ ok: true; token: string; expiresAt: string; subscriptionId: string } | { ok: false; revoked?: boolean }>

  getProfiles: () => Promise<{ ok: true; profiles: ProfileInfo[] } | { ok: false; error?: string }>
  connect: (profileId: string) => Promise<{ ok: true } | { ok: false; error?: string }>
  disconnect: () => Promise<{ ok: true } | { ok: false; error?: string }>
  status: () => Promise<{ status: VpnStatus; stats: VpnStats | null; profileId: string | null }>

  getSettings: () => Promise<DesktopSettingsState>
  setSettings: (settings: Partial<DesktopSettingsState>) => Promise<void>

  getUpdateState: () => Promise<UpdateInfoState>
  checkForUpdates: () => Promise<{ ok: boolean; state?: UpdateInfoState; error?: string; isDev?: boolean }>
  installUpdate: () => Promise<{ ok: boolean; error?: string }>
  openReleaseUrl: (url?: string) => Promise<{ ok: boolean }>
  onUpdateStateChanged: (callback: (state: UpdateInfoState) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
