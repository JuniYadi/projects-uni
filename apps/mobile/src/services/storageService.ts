// Storage service — expo-secure-store wrapper
// Keys: auth_token, auth_expires_at, subscription_id, device_fingerprint

import * as SecureStore from 'expo-secure-store'

const KEYS = {
  TOKEN: 'auth_token',
  EXPIRES_AT: 'auth_expires_at',
  SUB_ID: 'subscription_id',
  FINGERPRINT: 'device_fingerprint',
} as const

// ─── Token ────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.TOKEN)
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(KEYS.TOKEN, token)
}

export async function removeToken(): Promise<void> {
  return SecureStore.deleteItemAsync(KEYS.TOKEN)
}

// ─── Expiry ──────────────────────────────────────────────

export async function getExpiresAt(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.EXPIRES_AT)
}

export async function setExpiresAt(expiresAt: string): Promise<void> {
  return SecureStore.setItemAsync(KEYS.EXPIRES_AT, expiresAt)
}

export async function removeExpiresAt(): Promise<void> {
  return SecureStore.deleteItemAsync(KEYS.EXPIRES_AT)
}

// ─── Subscription ID (for "Remember me") ──────────────────

export async function getSubscriptionId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.SUB_ID)
}

export async function setSubscriptionId(subId: string): Promise<void> {
  return SecureStore.setItemAsync(KEYS.SUB_ID, subId)
}

export async function removeSubscriptionId(): Promise<void> {
  return SecureStore.deleteItemAsync(KEYS.SUB_ID)
}

// ─── Device Fingerprint ────────────────────────────────

export async function getFingerprint(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.FINGERPRINT)
}

export async function setFingerprint(fp: string): Promise<void> {
  return SecureStore.setItemAsync(KEYS.FINGERPRINT, fp)
}

// ─── Clear All ────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.TOKEN),
    SecureStore.deleteItemAsync(KEYS.EXPIRES_AT),
    SecureStore.deleteItemAsync(KEYS.SUB_ID),
    // fingerprint persists — device identity
  ])
}