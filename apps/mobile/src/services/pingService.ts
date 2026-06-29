import { Platform } from 'react-native'
import { ICMP, ICMPStatus } from 'ping-react-native'

export async function pingHost(host: string, signal?: AbortSignal): Promise<number | null> {
  if (Platform.OS === 'web' || signal?.aborted) return null

  return new Promise<number | null>((resolve) => {
    const icmp = new ICMP({ host, timeout: 1000, count: 3, interval: 250, packetSize: 64 })
    const samples: number[] = []
    let done = false
    const finish = (ping: number | null) => {
      if (done) return
      done = true
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
      icmp.stop()
      resolve(ping)
    }
    const abort = () => finish(null)
    const timeout = setTimeout(() => finish(null), 5000)
    signal?.addEventListener('abort', abort, { once: true })

    icmp.ping((result) => {
      if (result.status === ICMPStatus.ECHO) samples.push(result.rtt)
      if (result.isEnded) {
        samples.sort((a, b) => a - b)
        finish(samples[Math.floor(samples.length / 2)] ?? null)
      }
    })
  }).catch(() => null)
}

export async function withLivePing<T extends { ping: number; serverIp?: string | null; serverAddress: string }>(profiles: T[], signal?: AbortSignal): Promise<T[]> {
  const pings = new Map<string, number | null>()

  // ponytail: ICMP native module behaves like one runner on Android; keep it sequential.
  for (const profile of profiles) {
    if (signal?.aborted) break
    const host = profile.serverIp || profile.serverAddress
    if (!pings.has(host)) pings.set(host, await pingHost(host, signal))
  }

  return profiles.map((profile) => {
    const ping = pings.get(profile.serverIp || profile.serverAddress)
    return ping == null ? profile : { ...profile, ping }
  })
}
