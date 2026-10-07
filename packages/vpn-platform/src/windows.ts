import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs'
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

const resourcesDir =
  (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ??
  import.meta.dirname

export function createWindowsDriver(options: WindowsDriverOptions = {}): VpnPlatformDriver {
  // ponytail: prefer .exe (compiled), fallback to .ts for dev
  const helperPath = options.helperPath ?? (() => {
    const exe = path.join(resourcesDir, 'wg-helper.exe')
    return existsSync(exe) ? exe : path.join(resourcesDir, 'wg-helper.ts')
  })()
  const adapterName = options.adapterName ?? 'UniVPN'
  const tunnelDllPath = options.tunnelDllPath ?? path.join(resourcesDir, 'win', 'tunnel.dll')
  const wireguardDllPath = options.wireguardDllPath ?? path.join(resourcesDir, 'win', 'wireguard.dll')

  let connectProcess: ReturnType<typeof spawn> | null = null
  let status: VpnStatus = 'disconnected'
  let tempDir: string | null = null

  function runHelper(args: string[]): ReturnType<typeof spawn> {
    const isScript = helperPath.endsWith('.ts')
    const cmd = isScript ? 'bun' : helperPath
    const finalArgs = isScript ? ['run', helperPath, ...args] : args

    return spawn(cmd, finalArgs, {
      env: {
        ...process.env,
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
      // ponytail: DLL presence validated on first connect
      if (!existsSync(helperPath) && !helperPath.endsWith('.ts')) {
        throw new Error(`Helper not found: ${helperPath}`)
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
