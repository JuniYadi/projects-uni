// WireGuard .conf parser
// Parses the backend's plaintext config into the format expected by react-native-wireguard-vpn-patched

import type { WireGuardConfig } from '@univpn/shared'

class ConfigParseError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'ConfigParseError'
  }
}

function extract(section: string[], key: string): string | null {
  for (const line of section) {
    const trimmed = line.trim()
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const k = trimmed.slice(0, idx).trim().toLowerCase()
    if (k === key.toLowerCase()) return trimmed.slice(idx + 1).trim()
  }
  return null
}

function splitEndpoint(endpoint: string): { host: string; port: number } {
  // endpoint format: "host:port" or "[ipv6]:port"
  const lastColon = endpoint.lastIndexOf(':')
  if (lastColon === -1) throw new ConfigParseError(`Invalid endpoint: ${endpoint}`)
  const host = endpoint.slice(0, lastColon)
  const port = parseInt(endpoint.slice(lastColon + 1), 10)
  if (isNaN(port)) throw new ConfigParseError(`Invalid endpoint port: ${endpoint}`)
  return { host, port }
}

function splitCSV(val: string | null): string[] {
  if (!val) return []
  return val.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Parse a WireGuard .conf string into WireGuardConfig.
 *
 * @throws ConfigParseError if required fields are missing or malformed.
 */
export function parseWireGuardConfig(confText: string): WireGuardConfig {
  const lines = confText.split('\n')
  const sections: { name: string; lines: string[] }[] = []
  let current: string | null = null
  let acc: string[] = []

  for (const raw of lines) {
    const line = raw.trim()
    const sectionMatch = line.match(/^\[(\w+)\]$/)
    if (sectionMatch) {
      if (current) sections.push({ name: current, lines: acc })
      current = sectionMatch[1]
      acc = []
    } else if (line && !line.startsWith('#') && current) {
      acc.push(line)
    }
  }
  if (current) sections.push({ name: current, lines: acc })

  const iface = sections.find((s) => s.name.toLowerCase() === 'interface')
  const peer = sections.find((s) => s.name.toLowerCase() === 'peer')

  if (!iface) throw new ConfigParseError('Missing [Interface] section')
  if (!peer) throw new ConfigParseError('Missing [Peer] section')

  const privateKey = extract(iface.lines, 'PrivateKey')
  const publicKey = extract(peer.lines, 'PublicKey')
  const endpoint = extract(peer.lines, 'Endpoint')
  const allowedIPs = splitCSV(extract(peer.lines, 'AllowedIPs'))
  const presharedKey = extract(peer.lines, 'PresharedKey') ?? undefined
  // Filter out AllowedIPs-type addresses (0.0.0.0/0, ::/0) — those belong in [Peer] AllowedIPs, not interface address
  const address = splitCSV(extract(iface.lines, 'Address')).filter(
    (a) => a !== '0.0.0.0/0' && a !== '::/0' && a !== '0.0.0.0/32' && a !== '::/128'
  )
  const dns = splitCSV(extract(iface.lines, 'DNS'))
  const mtuRaw = extract(iface.lines, 'MTU')

  if (!privateKey) throw new ConfigParseError('Missing PrivateKey in [Interface]')
  if (!publicKey) throw new ConfigParseError('Missing PublicKey in [Peer]')
  if (!endpoint) throw new ConfigParseError('Missing Endpoint in [Peer]')

  const { host, port } = splitEndpoint(endpoint)

  if (allowedIPs.length === 0) {
    throw new ConfigParseError('Missing AllowedIPs in [Peer]')
  }

  const config: WireGuardConfig = {
    privateKey,
    publicKey,
    serverAddress: host,
    serverPort: port,
    allowedIPs,
    ...(address.length > 0 && { address }),
    ...(presharedKey && { presharedKey }),
    ...(dns.length > 0 && { dns }),
    ...(mtuRaw && { mtu: parseInt(mtuRaw, 10) }),
  }

  // ponytail: take first peer, warn about extras
  const extraPeers = sections.filter((s) => s.name.toLowerCase() === 'peer')
  if (extraPeers.length > 1) {
    console.warn(`[config-parser] ${extraPeers.length - 1} extra [Peer] sections ignored`)
  }
  return config
}
