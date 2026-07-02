import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // auth
  login: (subscriptionId: string) => ipcRenderer.invoke('auth:login', subscriptionId),
  logout: () => ipcRenderer.invoke('auth:logout'),
  restore: () => ipcRenderer.invoke('auth:restore'),

  // vpn
  getProfiles: () => ipcRenderer.invoke('vpn:getProfiles'),
  connect: (profileId: string) => ipcRenderer.invoke('vpn:connect', profileId),
  disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
  status: () => ipcRenderer.invoke('vpn:status'),

  // settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: { theme?: 'light' | 'dark' | 'system' }) =>
    ipcRenderer.invoke('settings:set', settings),
})

export {}
