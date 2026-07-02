import { app, safeStorage } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'
import type { AuthStorage } from '@univpn/api'

const STORAGE_FILE = 'auth.json'

type Store = Record<string, string>

function storePath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, STORAGE_FILE)
}

function readStore(): Store {
  try {
    const raw = readFileSync(storePath(), 'utf8')
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

function writeStore(store: Store): void {
  writeFileSync(storePath(), JSON.stringify(store), 'utf8')
}

function set(key: string, value: string | null): void {
  const store = readStore()
  if (value == null) {
    delete store[key]
  } else {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available')
    }
    store[key] = safeStorage.encryptString(value).toString('base64')
  }
  writeStore(store)
}

function get(key: string): string | null {
  const store = readStore()
  const encrypted = store[key]
  if (!encrypted) return null
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  } catch {
    return null
  }
}

async function getOrCreateFingerprint(): Promise<string> {
  let fp = get('fingerprint')
  if (fp) return fp
  const raw = `${os.hostname()}-${os.userInfo().username}-${os.machine()}-${os.platform()}-${randomUUID()}`
  fp = createHash('sha256').update(raw).digest('hex')
  set('fingerprint', fp)
  return fp
}

export const desktopStorage: AuthStorage = {
  getToken: async () => get('token'),
  setToken: async (token) => set('token', token),
  removeToken: async () => set('token', null),

  getExpiresAt: async () => get('expiresAt'),
  setExpiresAt: async (expiresAt) => set('expiresAt', expiresAt),
  removeExpiresAt: async () => set('expiresAt', null),

  getSubscriptionId: async () => get('subscriptionId'),
  setSubscriptionId: async (id) => set('subscriptionId', id),
  removeSubscriptionId: async () => set('subscriptionId', null),

  getFingerprint: getOrCreateFingerprint,
  setFingerprint: async (fp) => set('fingerprint', fp),

  clearAll: async () => {
    const store = readStore()
    for (const key of Object.keys(store)) {
      delete store[key]
    }
    writeStore(store)
  },
}
