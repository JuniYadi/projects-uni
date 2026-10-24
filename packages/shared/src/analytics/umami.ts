// Fire-and-forget Umami event tracking. Never throws, never blocks UI.
// No-op when the website id is empty. Never pass email, name, IP or tokens in `data`.
import { UMAMI_HOST, UMAMI_WEBSITE_ID } from "../constants/api"

export interface UmamiContext {
  /** e.g. "Android 14", "iOS 18", "macOS 15", "Windows 11" */
  os?: string
  appVersion?: string
  language?: string
  screen?: string
}

let ctx: UmamiContext = {}
let distinctId: string | undefined
let websiteId = UMAMI_WEBSITE_ID

export function configureUmami(next: UmamiContext & { websiteId?: string }): void {
  const { websiteId: id, ...rest } = next
  if (id !== undefined) websiteId = id
  ctx = { ...ctx, ...rest }
}

/** Stable pseudonymous id (FNV-1a hash) so the raw subscription id (a login credential) never leaves the device. */
export function hashId(raw: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0
  }
  return `u-${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`
}

export function setUmamiUser(userId: string | null | undefined): void {
  distinctId = userId ? hashId(userId) : undefined
}

export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  try {
    if (!websiteId) return
    const f = (globalThis as { fetch?: (url: string, init: unknown) => Promise<unknown> }).fetch
    if (!f) return
    const payload: Record<string, unknown> = {
      website: websiteId,
      hostname: "app.univpn",
      url: `/${name}`,
      language: ctx.language ?? "id",
      name,
    }
    if (ctx.screen) payload.screen = ctx.screen
    if (data) payload.data = data
    if (distinctId) payload.id = distinctId
    const ua = `Mozilla/5.0 (${ctx.os ?? "Unknown"}) UniVPN/${ctx.appVersion ?? "0"}`
    void Promise.resolve(
      f(`${UMAMI_HOST}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": ua },
        body: JSON.stringify({ type: "event", payload }),
      }),
    ).catch(() => {})
  } catch {
    // never throw
  }
}
