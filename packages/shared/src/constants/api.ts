export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://vpn.example.com/api/vpn/mobile"
export const API_TIMEOUT = 10_000
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
