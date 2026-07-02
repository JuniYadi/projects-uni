import { app } from 'electron'
import os from 'node:os'
import { API_BASE_URL } from '@univpn/shared'
import { createApiClient } from '@univpn/api'
import { desktopStorage } from './storage'

export const api = createApiClient({
  baseUrl: process.env.UNIVPN_API_BASE_URL ?? API_BASE_URL,
  storage: desktopStorage,
  device: () => ({
    name: `${os.platform()} ${os.hostname()}`,
    fingerprint: '', // diisi oleh storage.getFingerprint saat request
    platform: process.platform,
    osVersion: os.release(),
    appVersion: app.getVersion(),
  }),
})
