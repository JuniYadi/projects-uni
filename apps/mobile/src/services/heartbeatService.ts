// Heartbeat service — sends periodic keep-alive while VPN is connected
// POST /profiles/:pid/heartbeat every 5 minutes

import { api } from './api'

const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let intervalId: ReturnType<typeof setInterval> | null = null
let currentProfileId: string | null = null

/** Start sending heartbeats for a connected profile. */
export function startHeartbeat(profileId: string): void {
  stopHeartbeat() // ensure no duplicate
  currentProfileId = profileId

  // Send immediately
  sendHeartbeat(profileId)

  intervalId = setInterval(() => {
    sendHeartbeat(profileId)
  }, INTERVAL_MS)
}

/** Stop sending heartbeats. */
export function stopHeartbeat(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  currentProfileId = null
}

async function sendHeartbeat(profileId: string): Promise<void> {
  try {
    await api.sendHeartbeat(profileId)
  } catch {
    // ponytail: silent failure — heartbeat is best-effort
  }
}
