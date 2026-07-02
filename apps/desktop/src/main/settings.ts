import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SETTINGS_FILE = 'settings.json'

interface Settings {
  theme?: 'light' | 'dark' | 'system'
}

function settingsPath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, SETTINGS_FILE)
}

export function getSettings(): Settings {
  try {
    const raw = readFileSync(settingsPath(), 'utf8')
    return JSON.parse(raw) as Settings
  } catch {
    return {}
  }
}

export function setSettings(settings: Settings): void {
  writeFileSync(settingsPath(), JSON.stringify(settings), 'utf8')
}
