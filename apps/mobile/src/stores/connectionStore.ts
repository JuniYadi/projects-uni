import { create } from 'zustand';
import type { VpnProfile, ConnectionStatus } from '@/types/vpn';

interface ConnectionState {
  profile: VpnProfile | null;
  status: ConnectionStatus;
  startTime: number | null;
  elapsed: number;
  bytesDownloaded: number;
  bytesUploaded: number;
  error: string | null;
  connect: (profile: VpnProfile) => Promise<void>;
  disconnect: () => Promise<void>;
  tick: () => void;
  updateStats: (down: number, up: number) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  profile: null,
  status: 'disconnected',
  startTime: null,
  elapsed: 0,
  bytesDownloaded: 0,
  bytesUploaded: 0,
  error: null,

  connect: async (profile) => {
    set({ status: 'connecting', profile, error: null });
    try {
      // ponytail: mock — WireGuardVpnModule.connect(config)
      await new Promise((r) => setTimeout(r, 1500));
      set({ status: 'connected', startTime: Date.now(), elapsed: 0 });
    } catch {
      set({ status: 'disconnected', error: 'Connection failed' });
    }
  },

  disconnect: async () => {
    set({ status: 'disconnecting' });
    try {
      // ponytail: mock — WireGuardVpnModule.disconnect()
      await new Promise((r) => setTimeout(r, 500));
      get().reset();
    } catch {
      set({ status: 'connected', error: 'Disconnect failed' });
    }
  },

  tick: () => {
    const { status, startTime } = get();
    if (status === 'connected' && startTime) {
      set({ elapsed: Math.floor((Date.now() - startTime) / 1000) });
    }
  },

  updateStats: (down, up) => {
    set({ bytesDownloaded: down, bytesUploaded: up });
  },

  reset: () => {
    set({
      status: 'disconnected',
      startTime: null,
      elapsed: 0,
      bytesDownloaded: 0,
      bytesUploaded: 0,
      error: null,
    });
  },
}));
