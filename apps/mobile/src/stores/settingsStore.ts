import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AppSettings } from '@/types/vpn';

const KEYS = { SETTINGS: 'univpn_settings' } as const;

const DEFAULT_SETTINGS: AppSettings = {
  autoConnect: false,
  killSwitch: false,
  preferredProtocol: 'auto',
  dnsServer: 'default',
};

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEYS.SETTINGS);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppSettings>;
        set({ ...DEFAULT_SETTINGS, ...saved, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  update: async (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    const { load: _, loaded: __, update: ___, ...toSave } = get();
    try {
      await SecureStore.setItemAsync(KEYS.SETTINGS, JSON.stringify(toSave));
    } catch {
      // silent fail — settings changed in memory, best-effort persist
    }
  },
}));
