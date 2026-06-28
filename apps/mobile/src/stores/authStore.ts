import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthState, SubscriptionInfo } from '@/types/vpn';

interface AuthActions {
  subscriptionId: string | null;
  token: string | null;
  subscription: SubscriptionInfo | null;
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'expired';
  restore: () => Promise<boolean>;
  loginWithSubId: (subId: string) => Promise<void>;
  loginWithQr: (qrToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const KEYS = {
  TOKEN: 'univpn_token',
  SUB_ID: 'univpn_sub_id',
  DEVICE_NAME: 'univpn_device_name',
} as const;

export const useAuthStore = create<AuthActions>((set, get) => ({
  subscriptionId: null,
  token: null,
  subscription: null,
  status: 'idle',

  restore: async () => {
    // ponytail: skip auth for local dev, remove when real auth lands
    if (process.env.EXPO_PUBLIC_SKIP_AUTH === '1') {
      set({ token: 'dev-bypass', subscriptionId: 'dev', status: 'valid' });
      return true;
    }
    try {
      const token = await SecureStore.getItemAsync(KEYS.TOKEN);
      const subId = await SecureStore.getItemAsync(KEYS.SUB_ID);
      if (token && subId) {
        // ponytail: stored expiry check — pass via jwt-decode when token format known
        set({ token, subscriptionId: subId, status: 'valid' });
        return true;
      }
      set({ status: 'invalid' });
      return false;
    } catch {
      set({ status: 'invalid' });
      return false;
    }
  },

  loginWithSubId: async (subId: string) => {
    set({ status: 'loading' });
    try {
      // ponytail: mock — POST /api/vpn/mobile/auth/login
      const mockToken = `session_${subId}_${Date.now()}`;
      const mockSub: SubscriptionInfo = {
        id: subId,
        status: 'active',
        expiresAt: '2026-12-31',
      };
      await SecureStore.setItemAsync(KEYS.TOKEN, mockToken);
      await SecureStore.setItemAsync(KEYS.SUB_ID, subId);
      set({ token: mockToken, subscriptionId: subId, subscription: mockSub, status: 'valid' });
    } catch {
      set({ status: 'invalid' });
      throw new Error('Login failed');
    }
  },

  loginWithQr: async (qrToken: string) => {
    set({ status: 'loading' });
    try {
      // ponytail: mock — POST /pairing/claim
      const mockToken = `qr_session_${Date.now()}`;
      const mockSub: SubscriptionInfo = {
        id: 'SUB-0000-0000',
        status: 'active',
        expiresAt: '2026-12-31',
      };
      await SecureStore.setItemAsync(KEYS.TOKEN, mockToken);
      await SecureStore.setItemAsync(KEYS.SUB_ID, mockSub.id);
      set({ token: mockToken, subscriptionId: mockSub.id, subscription: mockSub, status: 'valid' });
    } catch {
      set({ status: 'invalid' });
      throw new Error('QR pairing failed');
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(KEYS.TOKEN);
      await SecureStore.deleteItemAsync(KEYS.SUB_ID);
      await SecureStore.deleteItemAsync(KEYS.DEVICE_NAME);
    } catch {
      // ignore secure store errors on logout
    }
    set({ token: null, subscriptionId: null, subscription: null, status: 'invalid' });
  },
}));
