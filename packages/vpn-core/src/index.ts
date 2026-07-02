import type { VpnApiClient } from '@univpn/api'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from '@univpn/vpn-platform'

export type { VpnStatus, VpnStats }

export interface VpnCoreOptions {
  api: VpnApiClient
  driver: VpnPlatformDriver
}

export class VpnCore {
  private api: VpnApiClient
  private driver: VpnPlatformDriver
  private _status: VpnStatus = 'disconnected'
  private profileId: string | null = null
  private _stats: VpnStats | null = null
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(options: VpnCoreOptions) {
    this.api = options.api
    this.driver = options.driver
  }

  async initialize(): Promise<void> {
    await this.driver.initialize()
  }

  async getProfiles() {
    return this.api.getProfiles()
  }

  async connect(profileId: string): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') {
      throw new Error('Already connecting or connected')
    }
    this._status = 'connecting'
    try {
      const { config } = await this.api.getProfileConfig(profileId)
      await this.driver.connect(config)
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
