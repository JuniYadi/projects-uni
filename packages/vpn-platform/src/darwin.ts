import { execFile } from 'node:child_process'
import { existsSync, writeFileSync, mkdtempSync } from 'node:fs'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import type { VpnPlatformDriver, VpnStats, VpnStatus } from './types'

export interface DarwinDriverOptions {
  /** Path to the compiled univpn-helper executable or mac-helper.ts script. */
  helperPath?: string
  /** Path to wireguard-go executable. */
  wireguardGoPath?: string
  /** Path to wg executable. */
  wgPath?: string
  /** Unix domain socket path for communicating with helper daemon. */
  socketPath?: string
}

function resolveMacResourcesDir(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
  const candidates = [
    process.env.UNIVPN_RESOURCES_DIR,
    resourcesPath ? path.join(resourcesPath, 'resources', 'mac') : null,
    resourcesPath ? path.join(resourcesPath, 'mac') : null,
    path.resolve(process.cwd(), 'apps/desktop/resources/mac'),
    path.resolve(process.cwd(), 'resources/mac'),
    path.resolve(import.meta.dirname, '../../../apps/desktop/resources/mac'),
    path.resolve(import.meta.dirname, '../../apps/desktop/resources/mac'),
    path.resolve(import.meta.dirname, '../resources/mac'),
  ].filter((p): p is string => Boolean(p && existsSync(p)))

  return candidates[0] ?? path.resolve(process.cwd(), 'apps/desktop/resources/mac')
}

function execFilePromise(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  const { promise, resolve, reject } = Promise.withResolvers<{ stdout: string; stderr: string }>()
  execFile(cmd, args, (err, stdout, stderr) => {
    if (err) {
      reject(new Error(`Command failed: ${cmd} ${args.join(' ')}\n${stderr || err.message}`))
    } else {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    }
  })
  return promise
}

export function createDarwinDriver(options: DarwinDriverOptions = {}): VpnPlatformDriver {
  const socketPath = options.socketPath ?? '/var/run/univpn.sock'
  const resDir = resolveMacResourcesDir()

  const helperPath = options.helperPath ?? (() => {
    const candidateBin = path.join(resDir, 'univpn-helper')
    if (existsSync(candidateBin)) return candidateBin
    const installed = '/Library/PrivilegedHelperTools/univpn-helper'
    if (existsSync(installed)) return installed
    const candidateTs = path.join(import.meta.dirname, 'mac-helper.ts')
    return existsSync(candidateTs) ? candidateTs : candidateBin
  })()

  const wireguardGoPath = options.wireguardGoPath ?? (() => {
    const candidate = path.join(resDir, 'wireguard-go')
    if (existsSync(candidate)) return candidate
    const installed = '/Library/PrivilegedHelperTools/wireguard-go'
    if (existsSync(installed)) return installed
    return candidate
  })()

  const wgPath = options.wgPath ?? (() => {
    const candidate = path.join(resDir, 'wg')
    if (existsSync(candidate)) return candidate
    const installed = '/Library/PrivilegedHelperTools/wg'
    if (existsSync(installed)) return installed
    return candidate
  })()

  let currentStatus: VpnStatus = 'disconnected'
  let daemonChecked = false

  async function sendSocketCommand<T = unknown>(cmd: string, payload: Record<string, unknown> = {}): Promise<T> {
    const { promise, resolve, reject } = Promise.withResolvers<T>()
    const client = net.createConnection(socketPath)

    let buffer = ''
    let resolved = false

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        client.destroy()
        reject(new Error(`Socket command '${cmd}' timed out`))
      }
    }, 15000)

    client.on('connect', () => {
      const msg = JSON.stringify({ id: String(Date.now()), cmd, ...payload }) + '\n'
      client.write(msg)
    })

    client.on('data', (chunk) => {
      buffer += chunk.toString()
      if (buffer.includes('\n')) {
        const line = buffer.split('\n')[0]!
        try {
          const res = JSON.parse(line)
          resolved = true
          clearTimeout(timer)
          client.end()
          if (res.ok) {
            resolve(res as T)
          } else {
            reject(new Error(res.error || `Socket command '${cmd}' failed`))
          }
        } catch (e) {
          resolved = true
          clearTimeout(timer)
          client.destroy()
          reject(e)
        }
      }
    })

    client.on('error', (err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        reject(err)
      }
    })

    return promise
  }

  async function isDaemonReachable(): Promise<boolean> {
    try {
      const res = await sendSocketCommand<{ ok: boolean; data: string }>('ping')
      return res.ok && res.data === 'pong'
    } catch {
      return false
    }
  }

  async function installLaunchDaemon(): Promise<void> {
    const isScript = helperPath.endsWith('.ts')
    const executable = isScript ? process.execPath : '/Library/PrivilegedHelperTools/univpn-helper'
    const daemonArgs = isScript
      ? `<string>run</string><string>${helperPath}</string><string>daemon</string>`
      : `<string>daemon</string>`

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.univpn.helper</string>
    <key>ProgramArguments</key>
    <array>
        <string>${executable}</string>
        ${daemonArgs}
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/var/log/univpn-helper.err</string>
    <key>StandardOutPath</key>
    <string>/var/log/univpn-helper.out</string>
</dict>
</plist>
`

    const tempDir = mkdtempSync(path.join(tmpdir(), 'univpn-install-'))
    const tempPlist = path.join(tempDir, 'com.univpn.helper.plist')
    writeFileSync(tempPlist, plistContent, 'utf8')

    const commands: string[] = [
      'mkdir -p /Library/PrivilegedHelperTools',
      'mkdir -p /Library/LaunchDaemons',
      'mkdir -p /var/run/wireguard',
    ]

    if (!isScript) {
      if (!existsSync(helperPath)) {
        throw new Error(`univpn-helper binary not found at ${helperPath}`)
      }
      commands.push(
        `cp -f "${helperPath}" /Library/PrivilegedHelperTools/univpn-helper`,
        `chmod 755 /Library/PrivilegedHelperTools/univpn-helper`,
        `chown root:wheel /Library/PrivilegedHelperTools/univpn-helper`
      )
    }

    if (existsSync(wireguardGoPath)) {
      commands.push(
        `cp -f "${wireguardGoPath}" /Library/PrivilegedHelperTools/wireguard-go`,
        `chmod 755 /Library/PrivilegedHelperTools/wireguard-go`,
        `chown root:wheel /Library/PrivilegedHelperTools/wireguard-go`
      )
    }

    if (existsSync(wgPath)) {
      commands.push(
        `cp -f "${wgPath}" /Library/PrivilegedHelperTools/wg`,
        `chmod 755 /Library/PrivilegedHelperTools/wg`,
        `chown root:wheel /Library/PrivilegedHelperTools/wg`
      )
    }

    commands.push(
      `cp -f "${tempPlist}" /Library/LaunchDaemons/com.univpn.helper.plist`,
      `chmod 644 /Library/LaunchDaemons/com.univpn.helper.plist`,
      `chown root:wheel /Library/LaunchDaemons/com.univpn.helper.plist`,
      `launchctl bootout system /Library/LaunchDaemons/com.univpn.helper.plist 2>/dev/null || launchctl unload /Library/LaunchDaemons/com.univpn.helper.plist 2>/dev/null || true`,
      `launchctl bootstrap system /Library/LaunchDaemons/com.univpn.helper.plist 2>/dev/null || launchctl load -w /Library/LaunchDaemons/com.univpn.helper.plist`
    )

    const fullScript = commands.join(' && ')
    const escapedAppleScript = `do shell script "${fullScript.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" with administrator privileges`

    try {
      await execFilePromise('osascript', ['-e', escapedAppleScript])
    } finally {
      try {
        const { rmSync } = await import('node:fs')
        rmSync(tempDir, { recursive: true, force: true })
      } catch {}
    }

    // Wait for daemon socket to become active
    for (let i = 0; i < 20; i++) {
      await sleep(250)
      if (await isDaemonReachable()) {
        return
      }
    }
    throw new Error('Helper daemon was installed but failed to open socket within 5 seconds')
  }

  async function ensureDaemon(): Promise<void> {
    if (await isDaemonReachable()) {
      daemonChecked = true
      return
    }

    // Try installing/starting LaunchDaemon with one-time privilege prompt
    await installLaunchDaemon()
    daemonChecked = true
  }

  return {
    initialize: async () => {
      if (await isDaemonReachable()) {
        daemonChecked = true
        return
      }
      if (!existsSync(helperPath) && !helperPath.endsWith('.ts')) {
        console.warn(`[UniVPN macOS] Helper not yet compiled at ${helperPath}`)
      }
    },

    connect: async (config: string) => {
      currentStatus = 'connecting'
      try {
        await ensureDaemon()
        await sendSocketCommand('connect', { config })
        currentStatus = 'connected'
      } catch (err) {
        currentStatus = 'error'
        throw err
      }
    },

    disconnect: async () => {
      currentStatus = 'disconnecting'
      try {
        if (await isDaemonReachable()) {
          await sendSocketCommand('disconnect')
        }
      } catch {
        // best effort
      } finally {
        currentStatus = 'disconnected'
      }
    },

    status: async (): Promise<VpnStatus> => {
      if (!daemonChecked) {
        return currentStatus
      }
      try {
        const res = await sendSocketCommand<{ status: VpnStatus }>('status')
        currentStatus = res.status
        return currentStatus
      } catch {
        return currentStatus
      }
    },

    stats: async (): Promise<VpnStats | null> => {
      try {
        const res = await sendSocketCommand<{ stats: VpnStats }>('stats')
        return res.stats ?? null
      } catch {
        return null
      }
    },
  }
}
