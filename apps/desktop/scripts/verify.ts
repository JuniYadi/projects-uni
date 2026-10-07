import { createApiClient, type AuthStorage } from '@univpn/api'
import { createVpnCore, type VpnCore } from '@univpn/vpn-core'
import { createNoopDriver, createDarwinDriver, createPlatformDriver, type VpnPlatformDriver, type VpnStats } from '@univpn/vpn-platform'
import { parseWireGuardConfig } from '../../../packages/vpn-platform/src/mac-helper'
import type { VpnApiClient } from '@univpn/api'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
    console.log(`✓ ${message}`)
  } else {
    failed++
    console.error(`✗ ${message}`)
  }
}

function createMemoryStorage(initial: Record<string, string> = {}): AuthStorage {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    getToken: async () => store.get('token') ?? null,
    setToken: async (v) => store.set('token', v),
    removeToken: async () => store.delete('token'),
    getExpiresAt: async () => store.get('expiresAt') ?? null,
    setExpiresAt: async (v) => store.set('expiresAt', v),
    removeExpiresAt: async () => store.delete('expiresAt'),
    getSubscriptionId: async () => store.get('subscriptionId') ?? null,
    setSubscriptionId: async (v) => store.set('subscriptionId', v),
    removeSubscriptionId: async () => store.delete('subscriptionId'),
    getFingerprint: async () => store.get('fingerprint') ?? null,
    setFingerprint: async (v) => store.set('fingerprint', v),
    clearAll: async () => store.clear(),
  }
}

// ─── 1. Login + session storage ──────────────────────────────

const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

const originalFetch = globalThis.fetch
globalThis.fetch = async (input: RequestInfo | URL) => {
  const url = input.toString()
  if (url.endsWith('/auth/login')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        deviceId: 'd1',
        token: 'test-token',
        expiresAt: future,
        subscription: { id: 'sub-123', status: 'ACTIVE', currentPeriodEnd: future },
        profiles: [],
      }),
    } as Response
  }
  return originalFetch(input)
}

const memoryStorage = createMemoryStorage()
const api = createApiClient({
  baseUrl: 'https://example.com',
  storage: memoryStorage,
  device: { name: 'Test', fingerprint: 'fp', platform: 'darwin', osVersion: '1', appVersion: '1' },
})

await api.loginWithSubId('sub-id')
assert((await memoryStorage.getToken()) === 'test-token', 'login menyimpan token')
assert((await memoryStorage.getSubscriptionId()) === 'sub-123', 'login menyimpan subscriptionId')
assert((await memoryStorage.getExpiresAt()) === future, 'login menyimpan expiresAt')

globalThis.fetch = originalFetch

// ─── 2. VpnCore state machine ────────────────────────────────

function createFakeDriver(): VpnPlatformDriver {
  let connected = false
  return {
    initialize: async () => {},
    connect: async () => {
      connected = true
    },
    disconnect: async () => {
      connected = false
    },
    status: async () => (connected ? 'connected' : 'disconnected'),
    stats: async (): Promise<VpnStats | null> => ({
      bytesSent: 100,
      bytesReceived: 200,
    }),
  }
}

const fakeApi = {
  getProfiles: async () => ({ profiles: [] }),
  getProfileConfig: async (profileId: string) => ({
    config: '[Interface]\nPrivateKey = test\nAddress = 10.0.0.2\n[Peer]\nPublicKey = peer\nAllowedIPs = 0.0.0.0/0\nEndpoint = 1.2.3.4:51820',
    format: 'wireguard' as const,
    profileId,
  }),
} as unknown as VpnApiClient

const driver = createFakeDriver()
const core = createVpnCore({ api: fakeApi, driver })
await core.initialize()
assert((await core.status()) === 'disconnected', 'status awal disconnected')
await core.connect('profile-1')
assert((await core.status()) === 'connected', 'setelah connect status connected')
assert(core.getCurrentProfileId() === 'profile-1', 'currentProfileId tersimpan')
const stats = await core.stats()
assert(stats !== null && stats.bytesReceived === 200, 'stats tersedia saat connected')
await core.disconnect()
assert((await core.status()) === 'disconnected', 'setelah disconnect status disconnected')

// ─── 3. Platform driver factory ──────────────────────────────

const noop = createNoopDriver()
assert(typeof noop.connect === 'function', 'noop driver tersedia untuk non-Windows')

const darwinDriver = createDarwinDriver()
assert(typeof darwinDriver.connect === 'function', 'createDarwinDriver menyediakan fungsi connect')
assert(typeof darwinDriver.initialize === 'function', 'createDarwinDriver menyediakan fungsi initialize')

const platformDriver = createPlatformDriver()
if (process.platform === 'darwin') {
  assert(typeof platformDriver.connect === 'function', 'createPlatformDriver mengembalikan darwin driver di macOS')
}

const sampleConf = `[Interface]
PrivateKey = aaaa
Address = 10.66.66.2/32, fd00::2/128
DNS = 1.1.1.1, 8.8.8.8
MTU = 1380

[Peer]
PublicKey = bbbb
Endpoint = 198.51.100.1:51820
AllowedIPs = 0.0.0.0/0, ::/0`

const parsed = parseWireGuardConfig(sampleConf)
assert(parsed.addresses.length === 2 && parsed.addresses[0] === '10.66.66.2/32', 'parseWireGuardConfig parse Address dengan benar')
assert(parsed.dnsServers.length === 2 && parsed.dnsServers[0] === '1.1.1.1', 'parseWireGuardConfig parse DNS dengan benar')
assert(parsed.mtu === 1380, 'parseWireGuardConfig parse MTU dengan benar')
assert(parsed.endpoint === '198.51.100.1:51820', 'parseWireGuardConfig parse Endpoint dengan benar')
assert(parsed.allowedIps.includes('0.0.0.0/0'), 'parseWireGuardConfig parse AllowedIPs dengan benar')
assert(!parsed.cleanConfig.includes('Address =') && !parsed.cleanConfig.includes('DNS ='), 'cleanConfig menyaring Address & DNS untuk wg tool')

// ─── 4. Linux driver bisa ditambah tanpa ubah VpnCore ─────────

const linuxDriver: VpnPlatformDriver = {
  initialize: async () => {},
  connect: async () => {},
  disconnect: async () => {},
  status: async () => 'disconnected',
  stats: async () => null,
}
const linuxCore: VpnCore = createVpnCore({ api: fakeApi, driver: linuxDriver })
await linuxCore.initialize()
assert((await linuxCore.status()) === 'disconnected', 'Linux driver bekerja dengan VpnCore yang sama')

// ─── 5. Session restore logic ────────────────────────────────

const restoreStorage = createMemoryStorage({
  token: 'old-token',
  expiresAt: future,
  subscriptionId: 'sub-123',
})
const restoreApi = createApiClient({
  baseUrl: 'https://example.com',
  storage: restoreStorage,
  device: { name: 'Test', fingerprint: 'fp', platform: 'darwin', osVersion: '1', appVersion: '1' },
})
// getProfiles akan pakai token; kita mock fetch supaya sukses
const tokenUsed = { value: '' }
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  tokenUsed.value = init?.headers?.['Authorization']?.toString() ?? ''
  const url = input.toString()
  if (url.endsWith('/profiles')) {
    return { ok: true, status: 200, json: async () => ({ profiles: [] }) } as Response
  }
  return originalFetch(input)
}
const profiles = await restoreApi.getProfiles()
assert(tokenUsed.value === 'Bearer old-token', 'restore menggunakan token yang tersimpan')
assert(profiles.profiles.length === 0, 'getProfiles berhasil setelah restore')

globalThis.fetch = originalFetch

// ─── 4. Ikon tray: 4 status × (Windows 16/20/32/64, macOS 18/36) ─

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const trayDir = join(import.meta.dir, '../resources/tray')
const pngSize = (f: string) => {
  const b = readFileSync(join(trayDir, f))
  return b.subarray(1, 4).toString() === 'PNG' ? b.readUInt32BE(16) : -1
}
for (const state of ['idle', 'connecting', 'connected', 'failed']) {
  for (const s of [16, 20, 32, 64]) {
    const f = `win-${state}-${s}.png`
    assert(existsSync(join(trayDir, f)) && pngSize(f) === s, `tray ${f} ada dan berukuran ${s}px`)
  }
  assert(pngSize(`mac-${state}Template.png`) === 18, `tray mac ${state} 18px`)
  assert(pngSize(`mac-${state}Template@2x.png`) === 36, `tray mac ${state} @2x 36px`)
}

// ─── Summary ─────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
