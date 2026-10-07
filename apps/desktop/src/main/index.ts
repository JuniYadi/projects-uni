import 'dotenv/config'
import { app, BrowserWindow, shell } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'
import './ipc'
import { vpnService } from './vpn'
import { createTray } from './tray'
import { setupAutoUpdater, registerUpdateIpc } from './updater'

let mainWindow: BrowserWindow | null = null
let quitting = false

function getAppIconPath(): string | undefined {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const primary = app.isPackaged
    ? path.join(process.resourcesPath, 'resources', iconName)
    : path.join(app.getAppPath(), 'resources', iconName)
  if (existsSync(primary)) return primary

  const pngFallback = primary.replace(/\.ico$/, '.png')
  if (existsSync(pngFallback)) return pngFallback

  const devFallback = path.join(__dirname, '../../resources/icon.png')
  if (existsSync(devFallback)) return devFallback

  return undefined
}

function showWindow(): void {
  if (!mainWindow) createWindow()
  mainWindow?.show()
  mainWindow?.focus()
}

function createWindow(): void {
  const appIcon = getAppIconPath()
  mainWindow = new BrowserWindow({
    // layar mobile di jendela sempit, tidak bisa dilebarkan
    width: 400,
    height: 700,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    ...(appIcon ? { icon: appIcon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    if (!process.argv.includes('--hidden')) mainWindow?.show()
  })

  // tutup jendela = sembunyi ke tray; keluar lewat menu tray ("Keluar")
  mainWindow.on('close', (e) => {
    if (quitting) return
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.whenReady().then(async () => {
    const appIcon = getAppIconPath()
    if (process.platform === 'darwin' && app.dock && appIcon) {
      try {
        app.dock.setIcon(appIcon)
      } catch (e) {
        console.warn('Gagal mengatur ikon dock macOS:', e)
      }
    }
    registerUpdateIpc()
    await vpnService.initialize()
    createWindow()
    if (mainWindow) setupAutoUpdater(mainWindow)
    createTray(showWindow)

    app.on('activate', showWindow)
  })

  app.on('before-quit', () => {
    quitting = true
  })

  // tetap hidup di tray saat jendela ditutup
  app.on('window-all-closed', () => {})
}
