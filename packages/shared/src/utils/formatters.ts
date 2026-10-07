export interface CountryInputObject {
  country?: string | null
  region?: string | null
  serverName?: string | null
  name?: string | null
  city?: string | null
}

export type CountryInput = string | CountryInputObject | null | undefined

const KNOWN_COUNTRIES: Record<string, { code: string; name: string }> = {
  ID: { code: 'ID', name: 'Indonesia' },
  SG: { code: 'SG', name: 'Singapore' },
  HK: { code: 'HK', name: 'Hong Kong' },
  JP: { code: 'JP', name: 'Japan' },
  US: { code: 'US', name: 'United States' },
  NL: { code: 'NL', name: 'Netherlands' },
  DE: { code: 'DE', name: 'Germany' },
  GB: { code: 'GB', name: 'United Kingdom' },
  AU: { code: 'AU', name: 'Australia' },
}

const COUNTRY_ALIAS_MAP: Record<string, string> = {
  // Hong Kong
  HK: 'HK',
  HKG: 'HK',
  HONGKONG: 'HK',
  'HONG KONG': 'HK',

  // United States / Amerika
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  AMERIKA: 'US',
  'AMERIKA SERIKAT': 'US',
  DALLAS: 'US',
  'LOS ANGELES': 'US',
  LA: 'US',
  'NEW YORK': 'US',
  'SAN FRANCISCO': 'US',
  MIAMI: 'US',
  CHICAGO: 'US',
  SEATTLE: 'US',
  WASHINGTON: 'US',
  ATLANTA: 'US',

  // Indonesia
  ID: 'ID',
  IDN: 'ID',
  INDONESIA: 'ID',
  JAKARTA: 'ID',

  // Singapore
  SG: 'SG',
  SGP: 'SG',
  SINGAPORE: 'SG',
  SINGAPURA: 'SG',

  // Japan
  JP: 'JP',
  JPN: 'JP',
  JAPAN: 'JP',
  JEPANG: 'JP',
  TOKYO: 'JP',

  // Netherlands
  NL: 'NL',
  NLD: 'NL',
  NETHERLANDS: 'NL',
  BELANDA: 'NL',
  AMSTERDAM: 'NL',

  // Germany
  DE: 'DE',
  DEU: 'DE',
  GERMANY: 'DE',
  JERMAN: 'DE',
  FRANKFURT: 'DE',
  BERLIN: 'DE',

  // United Kingdom
  GB: 'GB',
  UK: 'GB',
  GBR: 'GB',
  'UNITED KINGDOM': 'GB',
  'GREAT BRITAIN': 'GB',
  INGGRIS: 'GB',
  LONDON: 'GB',

  // Australia
  AU: 'AU',
  AUS: 'AU',
  AUSTRALIA: 'AU',
  SYDNEY: 'AU',
  MELBOURNE: 'AU',
}

function matchString(s: string): string | null {
  const clean = s.trim().toUpperCase()
  if (!clean) return null
  if (COUNTRY_ALIAS_MAP[clean]) return COUNTRY_ALIAS_MAP[clean]

  if (clean.includes('HONG KONG') || clean.includes('HONGKONG') || clean.includes('HKG')) return 'HK'
  if (
    clean.includes('UNITED STATES') ||
    clean.includes('AMERIKA') ||
    clean.includes('DALLAS') ||
    clean.includes('LOS ANGELES')
  ) {
    return 'US'
  }
  if (clean.includes('INDONESIA') || clean.includes('JAKARTA')) return 'ID'
  if (clean.includes('SINGAPORE') || clean.includes('SINGAPURA')) return 'SG'
  if (clean.includes('JAPAN') || clean.includes('JEPANG') || clean.includes('TOKYO')) return 'JP'
  if (clean.includes('NETHERLANDS') || clean.includes('BELANDA') || clean.includes('AMSTERDAM')) return 'NL'
  if (clean.includes('GERMANY') || clean.includes('JERMAN') || clean.includes('FRANKFURT')) return 'DE'
  if (clean.includes('UNITED KINGDOM') || clean.includes('INGGRIS') || clean.includes('LONDON')) return 'GB'
  if (clean.includes('AUSTRALIA') || clean.includes('SYDNEY')) return 'AU'

  const tokens = clean.split(/[^A-Z0-9]+/)
  for (const t of tokens) {
    if (COUNTRY_ALIAS_MAP[t]) return COUNTRY_ALIAS_MAP[t]
  }

  if (/^[A-Z]{2}$/.test(clean)) return clean
  return null
}

export function resolveCountryCode(input: CountryInput): string {
  if (!input) return ''
  if (typeof input === 'string') {
    return matchString(input) ?? (input.trim().length >= 2 ? input.trim().slice(0, 2).toUpperCase() : '')
  }

  if (input.country) {
    const c = matchString(input.country)
    if (c) return c
  }

  if (input.region) {
    const r = matchString(input.region)
    if (r) return r
  }

  const sName = input.serverName ?? input.name
  if (sName) {
    const s = matchString(sName)
    if (s) return s
  }

  const combined = `${input.country ?? ''} ${input.region ?? ''} ${sName ?? ''} ${input.city ?? ''}`.trim()
  if (combined) {
    const combMatch = matchString(combined)
    if (combMatch) return combMatch
  }

  const fallback = input.country || input.region || sName || ''
  const cleanFallback = fallback.trim().replace(/[^a-zA-Z]/g, '').toUpperCase()
  return cleanFallback.slice(0, 2)
}

export function resolveCountryName(codeOrInput: CountryInput): string {
  const code = resolveCountryCode(codeOrInput)
  return KNOWN_COUNTRIES[code]?.name ?? (typeof codeOrInput === 'string' ? codeOrInput : code)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function countryFlag(code: string): string {
  const cc = resolveCountryCode(code)
  if (cc.length !== 2) return '🏳️'
  const base = 0x1F1E6
  const a = cc.charCodeAt(0) - 65
  const b = cc.charCodeAt(1) - 65
  if (a < 0 || a > 25 || b < 0 || b > 25) return '🏳️'
  return String.fromCodePoint(base + a, base + b)
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * Check if a string is a valid IPv4 or IPv6 address (without port or CIDR).
 */
export function isIpAddress(ip: string | null | undefined): boolean {
  if (!ip) return false
  const trimmed = ip.trim().replace(/^\[|\]$/g, '')
  if (!trimmed) return false

  // IPv4: 4 octets 0-255
  const parts = trimmed.split('.')
  if (parts.length === 4) {
    return parts.every((p) => {
      if (!/^\d{1,3}$/.test(p)) return false
      const n = Number(p)
      return n >= 0 && n <= 255 && String(n) === p
    })
  }

  // IPv6: valid hex segments separated by colons
  if (trimmed.includes(':') && /^[0-9a-fA-F:]+$/.test(trimmed)) {
    const colons = (trimmed.match(/:/g) || []).length
    return colons >= 2 && colons <= 7
  }

  return false
}

/**
 * Choose endpoint host preferring IP address first, falling back to hostname/domain.
 */
export function resolveEndpointHost(options: {
  serverIp?: string | null
  hostname?: string | null
  currentHost?: string | null
}): string {
  const { serverIp, hostname, currentHost } = options
  if (isIpAddress(serverIp)) {
    return serverIp!.trim()
  }
  if (isIpAddress(currentHost)) {
    return currentHost!.trim()
  }
  if (hostname && hostname.trim()) {
    return hostname.trim()
  }
  if (currentHost && currentHost.trim()) {
    return currentHost.trim()
  }
  return (serverIp || '').trim()
}
