import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SETTINGS_FILE = 'settings.json'

export interface DesktopSettings {
  theme?: 'light' | 'dark' | 'system'
  lastProfileId?: string
  killSwitch?: boolean
  autoConnect?: boolean
  buttonStyle?: 'cyber' | 'classic'
  favorites?: string[]
}

const DEFAULT_SETTINGS: DesktopSettings = {
  theme: 'system',
  killSwitch: true,
  autoConnect: false,
  buttonStyle: 'cyber',
  favorites: [],
}

function settingsPath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, SETTINGS_FILE)
}

export function getSettings(): DesktopSettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function setSettings(settings: Partial<DesktopSettings>): void {
  writeFileSync(settingsPath(), JSON.stringify({ ...getSettings(), ...settings }), 'utf8')
}
