// Auth store — Zustand with real API integration

import { create } from 'zustand'
import * as storage from '@/services/storageService'
import { api, getErrorMessage } from '@/services/api'
import type { SubscriptionInfo } from '@univpn/shared'

// ponytail: dev bypass check
const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === '1'

interface AuthState {
  subscriptionId: string | null
  token: string | null
  expiresAt: string | null
  subscription: SubscriptionInfo | null
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'error'
  error: string | null
  restore: () => Promise<boolean>
  loginWithSubId: (subId: string) => Promise<void>
  loginWithQr: (pairingToken: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  subscriptionId: null,
  token: null,
  expiresAt: null,
  subscription: null,
  status: 'idle',
  error: null,

  restore: async () => {
    if (SKIP_AUTH) {
      set({ token: 'dev-bypass', subscriptionId: 'dev', status: 'valid' })
      return true
    }

    set({ status: 'loading' })
    try {
      const token = await storage.getToken()
      const expiresAt = await storage.getExpiresAt()
      const subId = await storage.getSubscriptionId()

      if (!token || !expiresAt || !subId) {
        set({ status: 'invalid' })
        return false
      }

      // Client-side expiry check
      if (new Date(expiresAt) < new Date()) {
        await storage.clearAll()
        set({ status: 'invalid' })
        return false
      }

      // Test token validity via profiles fetch
      await api.getProfiles()

      set({ token, expiresAt, subscriptionId: subId, status: 'valid' })
      return true
    } catch {
      await storage.clearAll()
      set({ status: 'invalid' })
      return false
    }
  },

  loginWithSubId: async (subId: string) => {
    set({ status: 'loading', error: null })
    try {
      const res = await api.loginWithSubId(subId)
      set({
        token: res.token,
        expiresAt: res.expiresAt,
        subscriptionId: res.subscription.id,
        subscription: res.subscription,
        status: 'valid',
      })
    } catch (err) {
      const code = (err as Error).message
      const msg = getErrorMessage(code as any)
      set({ status: 'error', error: msg })
      throw err
    }
  },

  loginWithQr: async (pairingToken: string) => {
    set({ status: 'loading', error: null })
    try {
      const res = await api.loginWithQr(pairingToken)
      set({
        token: res.token,
        expiresAt: res.expiresAt,
        subscriptionId: res.subscription.id,
        subscription: res.subscription,
        status: 'valid',
      })
    } catch (err) {
      const code = (err as Error).message
      const msg = getErrorMessage(code as any)
      set({ status: 'error', error: msg })
      throw err
    }
  },

  logout: async () => {
    await api.logout()
    set({
      token: null,
      expiresAt: null,
      subscriptionId: null,
      subscription: null,
      status: 'invalid',
      error: null,
    })
  },

  clearError: () => set({ error: null, status: 'idle' }),
}))

export default useAuthStore