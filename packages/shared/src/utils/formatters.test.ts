import { describe, expect, it } from 'bun:test'
import {
  countryFlag,
  formatBytes,
  formatDuration,
  resolveCountryCode,
  resolveCountryName,
  isIpAddress,
  resolveEndpointHost,
} from './formatters'

describe('resolveCountryCode', () => {
  it('resolves Hong Kong variants to HK', () => {
    expect(resolveCountryCode('HK')).toBe('HK')
    expect(resolveCountryCode('hk')).toBe('HK')
    expect(resolveCountryCode('HKG')).toBe('HK')
    expect(resolveCountryCode('Hongkong')).toBe('HK')
    expect(resolveCountryCode('HONG KONG')).toBe('HK')
    expect(resolveCountryCode({ serverName: 'Hongkong 01', region: 'Hongkong' })).toBe('HK')
    expect(resolveCountryCode({ serverName: 'Hongkong 01', region: 'Asia' })).toBe('HK')
    expect(resolveCountryCode({ serverName: 'HK-01', region: 'Asia' })).toBe('HK')
    expect(resolveCountryCode({ country: 'Hong Kong', region: 'Asia' })).toBe('HK')
    expect(resolveCountryCode({ country: 'Hongkong' })).toBe('HK')
  })

  it('resolves America / United States variants to US', () => {
    expect(resolveCountryCode('US')).toBe('US')
    expect(resolveCountryCode('us')).toBe('US')
    expect(resolveCountryCode('USA')).toBe('US')
    expect(resolveCountryCode('Amerika')).toBe('US')
    expect(resolveCountryCode('Amerika Serikat')).toBe('US')
    expect(resolveCountryCode('United States')).toBe('US')
    expect(resolveCountryCode('United States of America')).toBe('US')
    expect(resolveCountryCode({ serverName: 'Dallas 01', region: 'Amerika' })).toBe('US')
    expect(resolveCountryCode({ serverName: 'Los Angeles', region: 'Amerika' })).toBe('US')
    expect(resolveCountryCode({ serverName: 'US-West-01', region: 'Amerika' })).toBe('US')
    expect(resolveCountryCode({ country: 'Amerika', region: 'Amerika' })).toBe('US')
    expect(resolveCountryCode({ country: 'United States', city: 'Dallas' })).toBe('US')
  })

  it('resolves other primary countries', () => {
    expect(resolveCountryCode('Indonesia')).toBe('ID')
    expect(resolveCountryCode('Singapore')).toBe('SG')
    expect(resolveCountryCode('Japan')).toBe('JP')
    expect(resolveCountryCode('Tokyo')).toBe('JP')
    expect(resolveCountryCode('Netherlands')).toBe('NL')
    expect(resolveCountryCode('Germany')).toBe('DE')
    expect(resolveCountryCode({ serverName: 'Jakarta VIP', region: 'Asia' })).toBe('ID')
    expect(resolveCountryCode({ serverName: 'Singapore 01', region: 'Asia' })).toBe('SG')
    expect(resolveCountryCode({ serverName: 'Tokyo Fast', region: 'Asia' })).toBe('JP')
  })

  it('handles 2-letter ISO codes directly', () => {
    expect(resolveCountryCode('NL')).toBe('NL')
    expect(resolveCountryCode('DE')).toBe('DE')
    expect(resolveCountryCode('FR')).toBe('FR')
    expect(resolveCountryCode('au')).toBe('AU')
  })

  it('handles null / undefined / empty input safely', () => {
    expect(resolveCountryCode(null)).toBe('')
    expect(resolveCountryCode(undefined)).toBe('')
    expect(resolveCountryCode('')).toBe('')
    expect(resolveCountryCode({})).toBe('')
  })
})

describe('resolveCountryName', () => {
  it('returns friendly country names for known codes', () => {
    expect(resolveCountryName('US')).toBe('United States')
    expect(resolveCountryName('HK')).toBe('Hong Kong')
    expect(resolveCountryName('ID')).toBe('Indonesia')
    expect(resolveCountryName('SG')).toBe('Singapore')
    expect(resolveCountryName('JP')).toBe('Japan')
    expect(resolveCountryName('Hongkong')).toBe('Hong Kong')
    expect(resolveCountryName('Amerika')).toBe('United States')
  })
})

describe('countryFlag', () => {
  it('returns correct flag emoji for normalized codes', () => {
    expect(countryFlag('HK')).toBe('🇭🇰')
    expect(countryFlag('Hongkong')).toBe('🇭🇰')
    expect(countryFlag('US')).toBe('🇺🇸')
    expect(countryFlag('Amerika')).toBe('🇺🇸')
    expect(countryFlag('ID')).toBe('🇮🇩')
    expect(countryFlag('SG')).toBe('🇸🇬')
    expect(countryFlag('JP')).toBe('🇯🇵')
  })
})

describe('formatBytes and formatDuration', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats duration correctly', () => {
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(125)).toBe('2:05')
    expect(formatDuration(3665)).toBe('1:01:05')
  })
})

describe('isIpAddress', () => {
  it('identifies IPv4 addresses', () => {
    expect(isIpAddress('1.2.3.4')).toBe(true)
    expect(isIpAddress('103.28.84.12')).toBe(true)
    expect(isIpAddress('255.255.255.255')).toBe(true)
    expect(isIpAddress('256.0.0.1')).toBe(false)
    expect(isIpAddress('1.2.3')).toBe(false)
  })

  it('identifies IPv6 addresses', () => {
    expect(isIpAddress('2001:db8::1')).toBe(true)
    expect(isIpAddress('[2001:db8::1]')).toBe(true)
    expect(isIpAddress('::1')).toBe(true)
  })

  it('rejects domain names, invalid formats, and ports', () => {
    expect(isIpAddress('sg01.vpn.pfnapp.com')).toBe(false)
    expect(isIpAddress('1.2.3.4:51820')).toBe(false)
    expect(isIpAddress('')).toBe(false)
    expect(isIpAddress(null)).toBe(false)
    expect(isIpAddress(undefined)).toBe(false)
  })
})

describe('resolveEndpointHost', () => {
  it('prioritizes IP address over domain', () => {
    expect(
      resolveEndpointHost({
        serverIp: '103.28.84.12',
        hostname: 'sg01.vpn.pfnapp.com',
        currentHost: 'sg01.vpn.pfnapp.com',
      })
    ).toBe('103.28.84.12')
  })

  it('falls back to hostname when serverIp is null or not an IP', () => {
    expect(
      resolveEndpointHost({
        serverIp: null,
        hostname: 'sg01.vpn.pfnapp.com',
        currentHost: 'fallback.vpn.pfnapp.com',
      })
    ).toBe('sg01.vpn.pfnapp.com')
  })

  it('falls back to currentHost when both serverIp and hostname are absent', () => {
    expect(
      resolveEndpointHost({
        serverIp: null,
        hostname: null,
        currentHost: '1.2.3.4',
      })
    ).toBe('1.2.3.4')
  })
})
