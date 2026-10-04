import 'dotenv/config'
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import './ipc'
import { vpnService } from './vpn'
import { createTray } from './tray'

let mainWindow: BrowserWindow | null = null
let quitting = false

function showWindow(): void {
  if (!mainWindow) createWindow()
  mainWindow?.show()
  mainWindow?.focus()
}

function createWindow(): void {
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
    await vpnService.initialize()
    createWindow()
    createTray(showWindow)

    app.on('activate', showWindow)
  })

  app.on('before-quit', () => {
    quitting = true
  })

  // tetap hidup di tray saat jendela ditutup
  app.on('window-all-closed', () => {})
}
