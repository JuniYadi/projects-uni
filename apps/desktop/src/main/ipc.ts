import { ipcMain } from 'electron'
import { getErrorMessage } from '@univpn/api'
import type { VpnStats, VpnStatus } from '@univpn/vpn-platform'
import { api } from './api'
import { desktopStorage } from './storage'
import { vpnService } from './vpn'
import { getSettings, setSettings } from './settings'

ipcMain.handle('auth:login', async (_event, subscriptionId: string) => {
  try {
    const res = await api.loginWithSubId(subscriptionId)
    return { ok: true, subscription: res.subscription }
  } catch (err) {
    return { ok: false, error: getErrorMessage((err as Error).message) }
  }
})

ipcMain.handle('auth:logout', async () => {
  await api.logout()
})

ipcMain.handle('auth:restore', async () => {
  try {
    const token = await desktopStorage.getToken()
    const expiresAt = await desktopStorage.getExpiresAt()
    const subscriptionId = await desktopStorage.getSubscriptionId()

    if (!token || !expiresAt || !subscriptionId) {
      return { ok: false }
    }

    if (new Date(expiresAt) < new Date()) {
      await desktopStorage.clearAll()
      return { ok: false }
    }

    await api.getProfiles()
    return { ok: true, token, expiresAt, subscriptionId }
  } catch {
    await desktopStorage.clearAll()
    return { ok: false }
  }
})

ipcMain.handle('vpn:getProfiles', async () => {
  try {
    const res = await vpnService.getProfiles()
    return { ok: true, profiles: res.profiles }
  } catch (err) {
    return { ok: false, error: getErrorMessage((err as Error).message) }
  }
})

ipcMain.handle('vpn:connect', async (_event, profileId: string) => {
  try {
    await vpnService.connect(profileId)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: getErrorMessage((err as Error).message) }
  }
})

ipcMain.handle('vpn:disconnect', async () => {
  try {
    await vpnService.disconnect()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: getErrorMessage((err as Error).message) }
  }
})

ipcMain.handle('vpn:status', async () => {
  const status = await vpnService.status()
  const stats = await vpnService.stats()
  return { status, stats, profileId: vpnService.getCurrentProfileId() }
})

ipcMain.handle('settings:get', async () => getSettings())

ipcMain.handle('settings:set', async (_event, settings: { theme?: 'light' | 'dark' | 'system' }) => {
  setSettings(settings)
  return settings
})
