import type { VpnApiClient } from '@univpn/api'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from '@univpn/vpn-platform'
import { resolveEndpointHost, type ProfileInfo } from '@univpn/shared'

export type { VpnStatus, VpnStats }

export interface VpnCoreOptions {
  api: VpnApiClient
  driver: VpnPlatformDriver
}

export function applyEndpointPreference(config: string, profile?: ProfileInfo | null): string {
  if (!profile) return config

  const endpointMatch = config.match(/^([ \t]*Endpoint[ \t]*=[ \t]*)([^:\s\r\n]+|\[[0-9a-fA-F:]+\])(:\d+)([ \t]*\r?$)/m)
  if (!endpointMatch) return config

  const prefix = endpointMatch[1]!
  const currentHost = endpointMatch[2]!
  const portSuffix = endpointMatch[3]!
  const lineEnd = endpointMatch[4]!

  let chosenHost = resolveEndpointHost({
    serverIp: profile.serverIp,
    hostname: profile.hostname,
    currentHost,
  })

  if (chosenHost.includes(':') && !chosenHost.startsWith('[')) {
    chosenHost = `[${chosenHost}]`
  }

  return config.replace(
    /^([ \t]*Endpoint[ \t]*=[ \t]*)([^:\s\r\n]+|\[[0-9a-fA-F:]+\])(:\d+)([ \t]*\r?$)/m,
    `${prefix}${chosenHost}${portSuffix}${lineEnd}`
  )
}
const DNS_MAP: Record<string, string> = {
  cloudflare: '1.1.1.1, 1.0.0.1',
  google: '8.8.8.8, 8.8.4.4',
  adguard: '94.140.14.14, 94.140.15.15',
}

export function applyDnsPreference(config: string, dnsServer?: string | null): string {
  if (!dnsServer || dnsServer === 'default') {
    return config
  }

  const ips = DNS_MAP[dnsServer.toLowerCase()]
  if (!ips) {
    return config
  }

  if (/^([ \t]*DNS[ \t]*=[ \t]*).*$/m.test(config)) {
    return config.replace(/^([ \t]*DNS[ \t]*=[ \t]*).*$/m, `DNS = ${ips}`)
  }

  const interfaceMatch = config.match(/^\[Interface\][ \t]*(\r?\n|$)/m)
  if (interfaceMatch) {
    const nl = interfaceMatch[1] || '\n'
    return config.replace(/^\[Interface\][ \t]*(\r?\n|$)/m, `[Interface]${nl}DNS = ${ips}${nl}`)
  }

  return config
}


export class VpnCore {
  private api: VpnApiClient
  private driver: VpnPlatformDriver
  private _status: VpnStatus = 'disconnected'
  private profileId: string | null = null
  private _stats: VpnStats | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private cachedProfiles: ProfileInfo[] = []

  constructor(options: VpnCoreOptions) {
    this.api = options.api
    this.driver = options.driver
  }

  async initialize(): Promise<void> {
    await this.driver.initialize()
  }

  async getProfiles() {
    const res = await this.api.getProfiles()
    if (res?.profiles) {
      this.cachedProfiles = res.profiles
    }
    return res
  }

  async connect(profileId: string, options?: { dns?: string }): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') {
      throw new Error('Already connecting or connected')
    }
    this._status = 'connecting'
    try {
      const { config } = await this.api.getProfileConfig(profileId)

      let profile = this.cachedProfiles.find((p) => p.id === profileId)
      if (!profile) {
        try {
          const res = await this.getProfiles()
          profile = res?.profiles?.find((p) => p.id === profileId)
        } catch {
          // best-effort lookup
        }
      }

      let finalConfig = applyEndpointPreference(config, profile)
      finalConfig = applyDnsPreference(finalConfig, options?.dns)
      await this.driver.connect(finalConfig)
      this.profileId = profileId
      this._status = await this.driver.status()
      this.startPolling()
    } catch (err) {
      this._status = 'error'
      this.stopPolling()
      throw err
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling()
    await this.driver.disconnect()
    this._status = await this.driver.status()
    this.profileId = null
    this._stats = null
  }

  async status(): Promise<VpnStatus> {
    if (this._status === 'connected' || this._status === 'connecting') {
      this._status = await this.driver.status()
    }
    return this._status
  }

  async stats(): Promise<VpnStats | null> {
    if (this._status === 'connected') {
      this._stats = await this.driver.stats()
    }
    return this._stats
  }

  getCurrentProfileId(): string | null {
    return this.profileId
  }

  private startPolling(): void {
    this.stopPolling()
    this.timer = setInterval(async () => {
      this._status = await this.driver.status()
      if (this._status === 'connected') {
        this._stats = await this.driver.stats()
      }
    }, 2000)
  }

  private stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export function createVpnCore(options: VpnCoreOptions): VpnCore {
  return new VpnCore(options)
}
