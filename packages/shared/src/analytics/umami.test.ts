import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { configureUmami, hashId, setUmamiUser, trackEvent } from './umami'

const realFetch = globalThis.fetch
let calls: { url: string; init: any }[] = []

beforeEach(() => {
  calls = []
  ;(globalThis as any).fetch = (url: string, init: any) => {
    calls.push({ url, init })
    return Promise.resolve(new Response('ok'))
  }
  setUmamiUser(null)
})
afterEach(() => {
  ;(globalThis as any).fetch = realFetch
})

describe('trackEvent', () => {
  it('is a no-op when website id is empty', () => {
    configureUmami({ websiteId: '' })
    trackEvent('app-open')
    expect(calls.length).toBe(0)
  })

  it('posts the Umami payload with hashed distinct id and UA', () => {
    configureUmami({ websiteId: 'site-1', os: 'Android 14', appVersion: '1.2.3' })
    setUmamiUser('sub_123')
    trackEvent('vpn-connected', { country: 'SG' })
    expect(calls.length).toBe(1)
    expect(calls[0].url).toBe('https://analytics.pfnapp.com/api/send')
    expect(calls[0].init.headers['User-Agent']).toBe('Mozilla/5.0 (Android 14) UniVPN/1.2.3')
    const body = JSON.parse(calls[0].init.body)
    expect(body.type).toBe('event')
    expect(body.payload).toMatchObject({
      website: 'site-1',
      hostname: 'app.univpn',
      url: '/vpn-connected',
      name: 'vpn-connected',
      data: { country: 'SG' },
      id: hashId('sub_123'),
    })
    expect(body.payload.id).not.toContain('sub_123')
  })

  it('does not throw when fetch rejects or throws', async () => {
    configureUmami({ websiteId: 'site-1' })
    ;(globalThis as any).fetch = () => Promise.reject(new Error('net'))
    expect(() => trackEvent('app-open')).not.toThrow()
    ;(globalThis as any).fetch = () => {
      throw new Error('sync')
    }
    expect(() => trackEvent('app-open')).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
  })
})
