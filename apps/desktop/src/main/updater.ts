import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { vpnService } from './vpn'

export interface UpdateInfoState {
  currentVersion: string
  availableVersion?: string
  minSupportedVersion?: string
  mandatory?: boolean
  sunsetMessage?: string
  releaseNotes?: string
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'not-available' | 'error' | 'expired'
  progress?: number
  error?: string
}

let updateState: UpdateInfoState = {
  currentVersion: app.getVersion(),
  status: 'idle',
}

let updateTimer: NodeJS.Timeout | null = null

function compareSemVer(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function broadcastState(win?: BrowserWindow | null): void {
  const targetWin = win || BrowserWindow.getAllWindows()[0]
  if (targetWin && !targetWin.isDestroyed()) {
    targetWin.webContents.send('update:state-changed', updateState)
  }
}

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  updateState.currentVersion = app.getVersion()

  // In development, autoUpdater by default skips checking unless explicitly allowed.
  // We keep development graceful.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    updateState = {
      ...updateState,
      status: 'checking',
      error: undefined,
    }
    broadcastState(mainWindow)
  })

  autoUpdater.on('update-available', (info) => {
    const minSupported = (info as unknown as Record<string, unknown>).minSupportedVersion as string | undefined
    const isMandatory = Boolean((info as unknown as Record<string, unknown>).mandatory)
    const sunsetMsg = (info as unknown as Record<string, unknown>).sunsetMessage as string | undefined

    const isExpired = minSupported ? compareSemVer(updateState.currentVersion, minSupported) < 0 : false

    updateState = {
      ...updateState,
      availableVersion: info.version,
      minSupportedVersion: minSupported,
      mandatory: isMandatory,
      sunsetMessage: sunsetMsg,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      status: isExpired ? 'expired' : 'available',
      progress: 0,
    }
    broadcastState(mainWindow)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    // If not already expired/mandatory, remain in downloading status
    if (updateState.status !== 'expired') {
      updateState = {
        ...updateState,
        status: 'downloading',
        progress: Math.round(progressObj.percent),
      }
      broadcastState(mainWindow)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    updateState = {
      ...updateState,
      availableVersion: info.version,
      status: updateState.status === 'expired' ? 'expired' : 'ready',
      progress: 100,
    }
    broadcastState(mainWindow)
  })

  autoUpdater.on('update-not-available', () => {
    updateState = {
      ...updateState,
      status: 'not-available',
      progress: undefined,
    }
    broadcastState(mainWindow)
  })

  autoUpdater.on('error', (err) => {
    updateState = {
      ...updateState,
      status: 'error',
      error: err?.message || 'Gagal memeriksa pembaruan',
    }
    broadcastState(mainWindow)
  })

  // Initial check after 6 seconds (let startup finish first)
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(() => {})
    }
  }, 6000)

  // Periodic check every 24 hours
  updateTimer = setInterval(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates().catch(() => {})
    }
  }, 24 * 60 * 60 * 1000)
}

export function registerUpdateIpc(): void {
  ipcMain.handle('update:getState', async () => updateState)

  ipcMain.handle('update:check', async () => {
    if (!app.isPackaged) {
      // In dev mode, return mock current status or simulate latest check
      return {
        ok: true,
        state: updateState,
        isDev: true,
      }
    }
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true, state: updateState }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
  ipcMain.handle('update:install', async () => {
    try {
      // 🛡️ CRITICAL VPN SAFETY: Disconnect WireGuard gracefully before restarting
      try {
        await vpnService.disconnect()
      } catch (e) {
        console.warn('VPN cleanup before update encountered warning:', e)
      }

      if (updateTimer) {
        clearInterval(updateTimer)
        updateTimer = null
      }

      // macOS Ad-hoc signing fallback:
      // Without an Apple Developer ID certificate, Squirrel.Mac (ShipIt) silently fails
      // validation and refuses to replace the running /Applications bundle.
      if (process.platform === 'darwin') {
        const pendingDir = path.join(homedir(), 'Library/Caches/desktop-updater/pending')
        if (existsSync(pendingDir)) {
          const zips = readdirSync(pendingDir).filter((f) => f.endsWith('.zip'))
          if (zips.length > 0) {
            const targetZip = path.join(pendingDir, zips[0]!)
            const appBundle = '/Applications/UniVPN.app'
            const scriptPath = path.join(app.getPath('temp'), 'univpn-apply-update.sh')

            // Create self-contained script that waits for current app to exit,
            // extracts updated bundle, clears quarantine flags, and relaunches.
            const script = `#!/bin/bash
PID=${process.pid}
while kill -0 $PID 2>/dev/null; do
  sleep 0.2
done

TMP_DIR=$(mktemp -d /tmp/univpn-extract-XXXXXX)
ditto -xk "${targetZip}" "$TMP_DIR"
if [ -d "$TMP_DIR/UniVPN.app" ]; then
  rm -rf "${appBundle}"
  cp -R "$TMP_DIR/UniVPN.app" "${appBundle}"
  xattr -cr "${appBundle}" 2>/dev/null || true
  rm -rf "$TMP_DIR"
  open -a "${appBundle}"
else
  rm -rf "$TMP_DIR"
fi
rm -f "${scriptPath}"
exit 0
`
            writeFileSync(scriptPath, script, { mode: 0o755 })
            const child = spawn('/bin/bash', [scriptPath], {
              detached: true,
              stdio: 'ignore',
            })
            child.unref()
            app.quit()
            return { ok: true }
          }
        }
      }

      // Standard electron-updater installation (Windows NSIS / signed macOS)
      autoUpdater.quitAndInstall()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('update:openReleaseUrl', async (_e, url?: string) => {
    const target = url || 'https://github.com/juniyadi/projects-uni/releases/latest'
    await shell.openExternal(target)
    return { ok: true }
  })
}
