import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // auth
  login: (subscriptionId: string) => ipcRenderer.invoke('auth:login', subscriptionId),
  logout: () => ipcRenderer.invoke('auth:logout'),
  restore: () => ipcRenderer.invoke('auth:restore'),

  onAuthLost: (callback: (code: string) => void) => {
    const sub = (_: unknown, code: string) => callback(code)
    ipcRenderer.on('auth:lost', sub)
    return () => {
      ipcRenderer.removeListener('auth:lost', sub)
    }
  },

  // vpn
  getProfiles: () => ipcRenderer.invoke('vpn:getProfiles'),
  connect: (profileId: string) => ipcRenderer.invoke('vpn:connect', profileId),
  disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
  status: () => ipcRenderer.invoke('vpn:status'),

  // settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('settings:set', settings),

  // update
  getUpdateState: () => ipcRenderer.invoke('update:getState'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  openReleaseUrl: (url?: string) => ipcRenderer.invoke('update:openReleaseUrl', url),
  onUpdateStateChanged: (callback: (state: unknown) => void) => {
    const sub = (_: unknown, state: unknown) => callback(state)
    ipcRenderer.on('update:state-changed', sub)
    return () => {
      ipcRenderer.removeListener('update:state-changed', sub)
    }
  },
})

export {}
