#!/usr/bin/env bun
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { promises as dns } from 'node:dns'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
export interface ParsedConfig {
  addresses: string[]
  dnsServers: string[]
  mtu: number
  endpoint: string | null
  allowedIps: string[]
  cleanConfig: string
}

export interface TunnelState {
  interfaceName: string
  endpointIp: string | null
  defaultGateway: string | null
  primaryDevice: string | null
  serviceName: string | null
  savedDns: string[]
  routesAdded: string[]
  tempDir: string
  wireguardProcess: ChildProcess
}

let activeTunnel: TunnelState | null = null

const DEFAULT_SOCKET_PATH = '/var/run/univpn.sock'

// Locate wireguard-go and wg binaries
function resolveBinaries() {
  const envWgGo = process.env.UNIVPN_WIREGUARD_GO_PATH
  const envWg = process.env.UNIVPN_WG_PATH

  const resourcesDir =
    (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ??
    path.resolve(import.meta.dirname, '../../../apps/desktop/resources')

  const candidateWgGo = [
    envWgGo,
    path.join(resourcesDir, 'mac', 'wireguard-go'),
    '/usr/local/bin/wireguard-go',
    '/opt/homebrew/bin/wireguard-go',
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)))

  const candidateWg = [
    envWg,
    path.join(resourcesDir, 'mac', 'wg'),
    '/usr/local/bin/wg',
    '/opt/homebrew/bin/wg',
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)))

  return {
    wireguardGo: candidateWgGo[0] ?? 'wireguard-go',
    wg: candidateWg[0] ?? 'wg',
  }
}

export function exec(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
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

export function parseWireGuardConfig(rawConfig: string): ParsedConfig {
  const lines = rawConfig.split('\n')
  const addresses: string[] = []
  const dnsServers: string[] = []
  let mtu = 1420
  let endpoint: string | null = null
  const allowedIps: string[] = []

  let inInterface = false
  const cleanLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const stripped = line.replace(/#.*$/, '').trim()

    if (/^\[Interface\]/i.test(line)) {
      inInterface = true
      cleanLines.push(rawLine)
      continue
    }

    if (/^\[Peer\]/i.test(line)) {
      inInterface = false
      cleanLines.push(rawLine)
      continue
    }

    if (inInterface) {
      const matchAddr = stripped.match(/^Address\s*=\s*(.+)$/i)
      if (matchAddr) {
        addresses.push(
          ...matchAddr[1]!
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
        continue
      }

      const matchDns = stripped.match(/^DNS\s*=\s*(.+)$/i)
      if (matchDns) {
        dnsServers.push(
          ...matchDns[1]!
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
        continue
      }

      const matchMtu = stripped.match(/^MTU\s*=\s*(\d+)$/i)
      if (matchMtu) {
        mtu = Number.parseInt(matchMtu[1]!, 10)
        continue
      }
    } else {
      const matchEndpoint = stripped.match(/^Endpoint\s*=\s*(.+)$/i)
      if (matchEndpoint) {
        endpoint = matchEndpoint[1]!.trim()
      }

      const matchAllowed = stripped.match(/^AllowedIPs\s*=\s*(.+)$/i)
      if (matchAllowed) {
        allowedIps.push(
          ...matchAllowed[1]!
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      }
    }

    cleanLines.push(rawLine)
  }

  return {
    addresses,
    dnsServers,
    mtu,
    endpoint,
    allowedIps,
    cleanConfig: cleanLines.join('\n'),
  }
}

async function getDefaultGatewayAndInterface(): Promise<{ gateway: string; device: string }> {
  const { stdout } = await exec('route', ['-n', 'get', 'default'])
  const gatewayMatch = stdout.match(/gateway:\s+([^\s]+)/)
  const interfaceMatch = stdout.match(/interface:\s+([^\s]+)/)

  if (!gatewayMatch || !interfaceMatch) {
    throw new Error('Unable to determine default gateway and interface from route table')
  }

  return {
    gateway: gatewayMatch[1]!,
    device: interfaceMatch[1]!,
  }
}

async function getNetworkServiceName(device: string): Promise<string> {
  try {
    const { stdout } = await exec('networksetup', ['-listnetworkserviceorder'])
    const lines = stdout.split('\n')
    let currentService = 'Wi-Fi'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      const serviceMatch = line.match(/^\(\d+\)\s+(.+)$/)
      if (serviceMatch) {
        currentService = serviceMatch[1]!
      }
      if (line.includes(`Device: ${device}`)) {
        return currentService
      }
    }
  } catch {
    // fallback
  }
  return 'Wi-Fi'
}

async function getDnsServers(service: string): Promise<string[]> {
  try {
    const { stdout } = await exec('networksetup', ['-getdnsservers', service])
    if (stdout.includes("There aren't any DNS Servers") || stdout.includes('Error')) {
      return []
    }
    return stdout
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

async function setDnsServers(service: string, servers: string[]): Promise<void> {
  if (servers.length === 0) {
    await exec('networksetup', ['-setdnsservers', service, 'empty'])
  } else {
    await exec('networksetup', ['-setdnsservers', service, ...servers])
  }
}

async function resolveHost(hostWithPort: string): Promise<string> {
  let host = hostWithPort
  if (host.includes(':')) {
    if (host.startsWith('[')) {
      // IPv6 [addr]:port
      const endBracket = host.indexOf(']')
      host = host.substring(1, endBracket)
    } else {
      host = host.split(':')[0]!
    }
  }

  // Check if already an IP
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return host
  }

  const lookup = await dns.lookup(host, { family: 4 })
  return lookup.address
}

export async function connectTunnel(configText: string): Promise<string> {
  if (activeTunnel) {
    await disconnectTunnel()
  }

  const bins = resolveBinaries()
  const parsed = parseWireGuardConfig(configText)

  if (parsed.addresses.length === 0) {
    throw new Error('No Address found in [Interface] configuration')
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'univpn-mac-'))
  const tunNameFile = path.join(tempDir, 'tun-name')
  const cleanConfFile = path.join(tempDir, 'wg.conf')
  fs.writeFileSync(cleanConfFile, parsed.cleanConfig, { mode: 0o600 })

  // 1. Spawn wireguard-go
  const wgProc = spawn(bins.wireguardGo, ['-f', 'utun'], {
    env: {
      ...process.env,
      WG_TUN_NAME_FILE: tunNameFile,
      LOG_LEVEL: 'info',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  // Wait for tun-name file
  let ifaceName = ''
  for (let i = 0; i < 30; i++) {
    await sleep(100)
    if (fs.existsSync(tunNameFile)) {
      const content = fs.readFileSync(tunNameFile, 'utf8').trim()
      if (content) {
        ifaceName = content
        break
      }
    }
  }

  if (!ifaceName) {
    wgProc.kill()
    fs.rmSync(tempDir, { recursive: true, force: true })
    throw new Error('Timed out waiting for wireguard-go to create utun interface')
  }

  // Wait for UAPI socket
  const uapiSocket = `/var/run/wireguard/${ifaceName}.sock`
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(uapiSocket)) break
    await sleep(100)
  }

  // 2. Configure utun interface with ifconfig
  for (const addr of parsed.addresses) {
    const [ip] = addr.split('/')
    if (!ip) continue

    if (ip.includes(':')) {
      // IPv6
      const prefix = addr.split('/')[1] ?? '128'
      await exec('ifconfig', [ifaceName, 'inet6', ip, 'prefixlen', prefix])
    } else {
      // IPv4 point-to-point interface
      await exec('ifconfig', [ifaceName, 'inet', ip, ip, 'netmask', '255.255.255.255'])
    }
  }

  await exec('ifconfig', [ifaceName, 'mtu', String(parsed.mtu)])
  await exec('ifconfig', [ifaceName, 'up'])

  // 3. Set WireGuard config via wg tool
  await exec(bins.wg, ['setconf', ifaceName, cleanConfFile])

  // 4. Set Routing
  const routesAdded: string[] = []
  let endpointIp: string | null = null
  let defaultGateway: string | null = null
  let primaryDevice: string | null = null

  try {
    const gw = await getDefaultGatewayAndInterface()
    defaultGateway = gw.gateway
    primaryDevice = gw.device

    if (parsed.endpoint) {
      endpointIp = await resolveHost(parsed.endpoint)
      // Direct host route for WireGuard server endpoint via physical gateway
      await exec('route', ['-q', '-n', 'add', '-host', endpointIp, '-gateway', defaultGateway])
      routesAdded.push(`host:${endpointIp}`)
    }

    const hasDefaultRoute = parsed.allowedIps.some((cidr) => cidr === '0.0.0.0/0')
    if (hasDefaultRoute) {
      // 0/1 and 128/1 standard VPN route trick
      await exec('route', ['-q', '-n', 'add', '-inet', '0.0.0.0/1', '-interface', ifaceName])
      await exec('route', ['-q', '-n', 'add', '-inet', '128.0.0.0/1', '-interface', ifaceName])
      routesAdded.push('0.0.0.0/1')
      routesAdded.push('128.0.0.0/1')
    } else {
      for (const cidr of parsed.allowedIps) {
        await exec('route', ['-q', '-n', 'add', '-inet', cidr, '-interface', ifaceName])
        routesAdded.push(cidr)
      }
    }
  } catch (err) {
    console.error('Warning configuring routes:', err)
  }

  // 5. Configure DNS
  let serviceName: string | null = null
  let savedDns: string[] = []

  if (parsed.dnsServers.length > 0 && primaryDevice) {
    try {
      serviceName = await getNetworkServiceName(primaryDevice)
      savedDns = await getDnsServers(serviceName)
      await setDnsServers(serviceName, parsed.dnsServers)
    } catch (err) {
      console.error('Warning configuring DNS:', err)
    }
  }

  activeTunnel = {
    interfaceName: ifaceName,
    endpointIp,
    defaultGateway,
    primaryDevice,
    serviceName,
    savedDns,
    routesAdded,
    tempDir,
    wireguardProcess: wgProc,
  }

  return ifaceName
}

export async function disconnectTunnel(): Promise<void> {
  if (!activeTunnel) return

  const {
    interfaceName,
    endpointIp,
    serviceName,
    savedDns,
    routesAdded,
    tempDir,
    wireguardProcess,
  } = activeTunnel

  // 1. Remove routes
  for (const route of routesAdded) {
    try {
      if (route.startsWith('host:')) {
        const host = route.replace('host:', '')
        await exec('route', ['-q', '-n', 'delete', '-host', host])
      } else {
        await exec('route', ['-q', '-n', 'delete', '-inet', route, '-interface', interfaceName])
      }
    } catch {
      // ignore route deletion errors
    }
  }

  // 2. Restore DNS
  if (serviceName) {
    try {
      await setDnsServers(serviceName, savedDns)
    } catch (err) {
      console.error('Warning restoring DNS:', err)
    }
  }

  // 3. Kill wireguard-go process (automatically removes utun device)
  try {
    wireguardProcess.kill('SIGTERM')
    await sleep(300)
    if (!wireguardProcess.killed) {
      wireguardProcess.kill('SIGKILL')
    }
  } catch {
    // process already exited
  }

  // 4. Clean up temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
    const uapiSocket = `/var/run/wireguard/${interfaceName}.sock`
    if (fs.existsSync(uapiSocket)) {
      fs.unlinkSync(uapiSocket)
    }
  } catch {
    // cleanup best effort
  }

  activeTunnel = null
}

export function getTunnelStatus(): string {
  if (!activeTunnel) return 'disconnected'
  if (activeTunnel.wireguardProcess.exitCode !== null) {
    return 'disconnected'
  }
  return 'connected'
}

export async function getTunnelStats(): Promise<{ bytesSent: number; bytesReceived: number }> {
  if (!activeTunnel) return { bytesSent: 0, bytesReceived: 0 }
  const bins = resolveBinaries()
  try {
    const { stdout } = await exec(bins.wg, ['show', activeTunnel.interfaceName, 'transfer'])
    const parts = stdout.trim().split(/\s+/)
    if (parts.length >= 2) {
      return {
        bytesReceived: Number.parseInt(parts[0]!, 10) || 0,
        bytesSent: Number.parseInt(parts[1]!, 10) || 0,
      }
    }
  } catch {
    // ignore
  }
  return { bytesSent: 0, bytesReceived: 0 }
}

export function startDaemon(socketPath = DEFAULT_SOCKET_PATH) {
  if (fs.existsSync(socketPath)) {
    try {
      fs.unlinkSync(socketPath)
    } catch (e) {
      console.error(`Cannot remove old socket at ${socketPath}:`, e)
    }
  }

  const server = net.createServer((socket) => {
    let buffer = ''

    socket.on('data', async (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const req = JSON.parse(line)
          const res = await handleRequest(req)
          socket.write(JSON.stringify(res) + '\n')
        } catch (err) {
          socket.write(JSON.stringify({ ok: false, error: (err as Error).message }) + '\n')
        }
      }
    })
  })

  server.listen(socketPath, () => {
    try {
      fs.chmodSync(socketPath, 0o666)
    } catch {
      // best effort
    }
    console.log(`UniVPN helper daemon listening on ${socketPath}`)
  })

  const cleanup = async () => {
    console.log('Stopping UniVPN helper daemon...')
    await disconnectTunnel()
    try {
      if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath)
      }
    } catch {}
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

async function handleRequest(req: { id?: string; cmd: string; config?: string }) {
  const id = req.id
  switch (req.cmd) {
    case 'ping':
      return { id, ok: true, data: 'pong' }
    case 'connect': {
      if (!req.config) {
        return { id, ok: false, error: 'Missing config parameter' }
      }
      const iface = await connectTunnel(req.config)
      return { id, ok: true, status: 'connected', interface: iface }
    }
    case 'disconnect':
      await disconnectTunnel()
      return { id, ok: true, status: 'disconnected' }
    case 'status':
      return { id, ok: true, status: getTunnelStatus() }
    case 'stats': {
      const stats = await getTunnelStats()
      return { id, ok: true, stats }
    }
    default:
      return { id, ok: false, error: `Unknown command: ${req.cmd}` }
  }
}

// CLI entrypoint
const args = process.argv.slice(2)
const cmd = args[0]

if (cmd === 'daemon') {
  const sock = args[1] || DEFAULT_SOCKET_PATH
  startDaemon(sock)
} else if (cmd === 'connect') {
  const confPath = args[1]
  if (!confPath) {
    console.error('Usage: mac-helper connect <confPath>')
    process.exit(1)
  }
  const conf = fs.readFileSync(confPath, 'utf8')
  connectTunnel(conf)
    .then((iface) => {
      console.log(JSON.stringify({ ok: true, status: 'connected', interface: iface }))
    })
    .catch((err) => {
      console.error(JSON.stringify({ ok: false, error: err.message }))
      process.exit(1)
    })
} else if (cmd === 'disconnect') {
  disconnectTunnel().then(() => {
    console.log(JSON.stringify({ ok: true, status: 'disconnected' }))
  })
} else if (cmd === 'status') {
  console.log(JSON.stringify({ ok: true, status: getTunnelStatus() }))
} else if (cmd === 'stats') {
  getTunnelStats().then((s) => {
    console.log(JSON.stringify({ ok: true, stats: s }))
  })
}
