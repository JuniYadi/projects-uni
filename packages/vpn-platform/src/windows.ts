import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export interface WindowsDriverOptions {
  /** Path to the Bun helper script or compiled executable. */
  helperPath?: string
  /** Path to tunnel.dll. Passed to helper via env. */
  tunnelDllPath?: string
  /** Path to wireguard.dll. Passed to helper via env. */
  wireguardDllPath?: string
  adapterName?: string
}

function resolveFirstExisting(paths: (string | null | undefined)[]): string | undefined {
  for (const p of paths) {
    if (p && existsSync(p)) return p
  }
  return undefined
}

export function resolveWindowsResources(options: WindowsDriverOptions = {}) {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath

  const candidateDirs = [
    process.env.UNIVPN_RESOURCES_DIR,
    resourcesPath ? path.join(resourcesPath, 'win') : null,
    resourcesPath ? path.join(resourcesPath, 'resources', 'win') : null,
    resourcesPath ? path.join(resourcesPath, 'resources') : null,
    resourcesPath ?? null,
    path.resolve(process.cwd(), 'apps/desktop/resources/win'),
    path.resolve(process.cwd(), 'resources/win'),
    path.resolve(process.cwd(), 'apps/desktop/resources'),
    path.resolve(process.cwd(), 'resources'),
    path.resolve(import.meta.dirname, '../../../apps/desktop/resources/win'),
    path.resolve(import.meta.dirname, '../../apps/desktop/resources/win'),
    path.resolve(import.meta.dirname, '../resources/win'),
    path.resolve(import.meta.dirname, '../../../apps/desktop/resources'),
    path.resolve(import.meta.dirname, '../../apps/desktop/resources'),
    path.resolve(import.meta.dirname, '../resources'),
    import.meta.dirname,
  ].filter((d): d is string => Boolean(d && existsSync(d)))

  // 1. Resolve helper executable or TypeScript fallback for dev
  const helperExe = resolveFirstExisting([
    options.helperPath && options.helperPath.endsWith('.exe') ? options.helperPath : null,
    ...candidateDirs.map((d) => path.join(d, 'wg-helper.exe')),
    ...candidateDirs.map((d) => path.join(d, 'win', 'wg-helper.exe')),
  ])

  const helperScript = resolveFirstExisting([
    options.helperPath && options.helperPath.endsWith('.ts') ? options.helperPath : null,
    path.join(import.meta.dirname, 'wg-helper.ts'),
    path.resolve(process.cwd(), 'packages/vpn-platform/src/wg-helper.ts'),
    path.resolve(process.cwd(), 'apps/desktop/resources/wg-helper.ts'),
    ...candidateDirs.map((d) => path.join(d, 'wg-helper.ts')),
  ])

  const helperPath = options.helperPath ?? helperExe ?? helperScript ?? (
    resourcesPath ? path.join(resourcesPath, 'win', 'wg-helper.exe') : path.join(import.meta.dirname, 'wg-helper.ts')
  )

  const helperDir = path.dirname(helperPath)

  // 2. Resolve tunnel.dll
  const tunnelDllPath = options.tunnelDllPath ?? resolveFirstExisting([
    path.join(helperDir, 'tunnel.dll'),
    ...candidateDirs.map((d) => path.join(d, 'tunnel.dll')),
    ...candidateDirs.map((d) => path.join(d, 'win', 'tunnel.dll')),
  ]) ?? (
    resourcesPath ? path.join(resourcesPath, 'win', 'tunnel.dll') : path.join(import.meta.dirname, 'tunnel.dll')
  )

  // 3. Resolve wireguard.dll
  const wireguardDllPath = options.wireguardDllPath ?? resolveFirstExisting([
    path.join(helperDir, 'wireguard.dll'),
    ...candidateDirs.map((d) => path.join(d, 'wireguard.dll')),
    ...candidateDirs.map((d) => path.join(d, 'win', 'wireguard.dll')),
  ]) ?? (
    resourcesPath ? path.join(resourcesPath, 'win', 'wireguard.dll') : path.join(import.meta.dirname, 'wireguard.dll')
  )

  // 4. Co-locate wireguard.dll & tunnel.dll in helper directory if helper is .exe
  // wireguard-windows tunnel service strictly loads wireguard.dll using LOAD_LIBRARY_SEARCH_APPLICATION_DIR,
  // which only searches the directory of the running process executable (wg-helper.exe).
  if (helperPath.endsWith('.exe')) {
    if (existsSync(wireguardDllPath)) {
      const targetWg = path.join(helperDir, 'wireguard.dll')
      if (!existsSync(targetWg)) {
        try {
          copyFileSync(wireguardDllPath, targetWg)
        } catch {
          // best-effort copy
        }
      }
    }
    if (existsSync(tunnelDllPath)) {
      const targetTunnel = path.join(helperDir, 'tunnel.dll')
      if (!existsSync(targetTunnel)) {
        try {
          copyFileSync(tunnelDllPath, targetTunnel)
        } catch {
          // best-effort copy
        }
      }
    }
  }

  return { helperPath, tunnelDllPath, wireguardDllPath }
}

export function createWindowsDriver(options: WindowsDriverOptions = {}): VpnPlatformDriver {
  const { helperPath, tunnelDllPath, wireguardDllPath } = resolveWindowsResources(options)
  const adapterName = options.adapterName ?? 'UniVPN'
  let connectProcess: ReturnType<typeof spawn> | null = null
  let status: VpnStatus = 'disconnected'
  let tempDir: string | null = null

  function runHelper(args: string[]): ReturnType<typeof spawn> {
    const isScript = helperPath.endsWith('.ts')
    const cmd = isScript ? 'bun' : helperPath
    const finalArgs = isScript ? ['run', helperPath, ...args] : args
    const helperDir = path.dirname(helperPath)
    const tunnelDir = path.dirname(tunnelDllPath)
    const wgDir = path.dirname(wireguardDllPath)

    return spawn(cmd, finalArgs, {
      cwd: helperDir,
      env: {
        ...process.env,
        PATH: `${tunnelDir};${wgDir};${helperDir};${process.env.PATH || ''}`,
        UNIVPN_TUNNEL_DLL: tunnelDllPath,
        UNIVPN_WIREGUARD_DLL: wireguardDllPath,
        UNIVPN_ADAPTER_NAME: adapterName,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }

  async function queryStatus(): Promise<VpnStatus> {
    return new Promise((resolve) => {
      const proc = runHelper(['status'])
      let stdout = ''
      proc.stdout?.on('data', (chunk) => {
        stdout += chunk.toString()
      })
      proc.on('close', () => {
        try {
          const parsed = JSON.parse(stdout.trim()) as { status: VpnStatus }
          resolve(parsed.status)
        } catch {
          resolve('error')
        }
      })
      proc.on('error', () => resolve('error'))
    })
  }

  return {
    initialize: async () => {
      if (!existsSync(helperPath) && !helperPath.endsWith('.ts')) {
        throw new Error(`WireGuard helper tidak ditemukan: ${helperPath}`)
      }
      if (!existsSync(tunnelDllPath)) {
        throw new Error(`WireGuard tunnel DLL tidak ditemukan di: ${tunnelDllPath}`)
      }
      if (!existsSync(wireguardDllPath)) {
        throw new Error(`WireGuard NT driver DLL tidak ditemukan di: ${wireguardDllPath}`)
      }
    },

    connect: async (config: string) => {
      if (connectProcess) {
        throw new Error('Already connected')
      }

      tempDir = mkdtempSync(path.join(tmpdir(), 'univpn-'))
      const confPath = path.join(tempDir, 'univpn.conf')
      writeFileSync(confPath, config, 'utf8')

      status = 'connecting'
      connectProcess = runHelper(['connect', confPath])

      return new Promise<void>((resolve, reject) => {
        let stderr = ''
        let stdout = ''
        let settled = false

        connectProcess!.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
          try {
            const lines = stdout.split('\n')
            for (const line of lines) {
              if (!line.trim()) continue
              const res = JSON.parse(line.trim())
              if (res.status === 'started' && !settled) {
                settled = true
                status = 'connected'
                resolve()
              } else if (res.status === 'error' && !settled) {
                settled = true
                status = 'error'
                reject(new Error(res.error || 'Gagal memulai adapter WireGuard (butuh akses Administrator)'))
              }
            }
          } catch {
            // non-json output or partial stream
          }
        })

        connectProcess!.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })

        connectProcess!.on('error', (err) => {
          if (!settled) {
            settled = true
            status = 'error'
            connectProcess = null
            reject(err)
          }
        })

        // Give the helper up to 3 seconds to confirm startup via stdout
        const timeout = setTimeout(() => {
          if (!settled && status === 'connecting') {
            settled = true
            status = 'connected'
            resolve()
          }
        }, 3000)

        connectProcess!.on('close', (code) => {
          clearTimeout(timeout)
          connectProcess = null
          if (!settled || status === 'connecting') {
            settled = true
            status = 'error'
            const msg = stderr.trim() || `WireGuard helper terminated (exit code ${code}). Pastikan aplikasi dijalankan dengan hak Administrator.`
            reject(new Error(msg))
          }
        })
      })
    },

    disconnect: async () => {
      if (!connectProcess) {
        status = 'disconnected'
        return
      }
      connectProcess.kill()
      connectProcess = null
      status = 'disconnected'
    },

    status: async () => {
      if (!connectProcess) return 'disconnected'
      return queryStatus()
    },

    stats: async (): Promise<VpnStats | null> => {
      if (!connectProcess) return null
      return new Promise((resolve) => {
        const proc = runHelper(['stats'])
        let stdout = ''
        proc.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        proc.on('close', () => {
          try {
            resolve(JSON.parse(stdout.trim()) as VpnStats)
          } catch {
            resolve(null)
          }
        })
        proc.on('error', () => resolve(null))
      })
    },
  }
}
