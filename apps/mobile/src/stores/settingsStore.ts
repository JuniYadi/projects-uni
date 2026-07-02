import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AppSettings, VpnApp } from '@/types/vpn';

const KEYS = { SETTINGS: 'univpn_settings' } as const;

const DEFAULT_SETTINGS: AppSettings = {
  autoConnect: false,
  killSwitch: false,
  preferredProtocol: 'auto',
  dnsServer: 'default',
  whitelistedApps: [],
  theme: 'system',
};


interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => Promise<void>;
  addWhitelistedApp: (app: VpnApp) => Promise<void>;
  removeWhitelistedApp: (packageName: string) => Promise<void>;
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
    const { load: _, loaded: __, update: ___, addWhitelistedApp: ____, removeWhitelistedApp: _____, ...toSave } = get();
    try {
      await SecureStore.setItemAsync(KEYS.SETTINGS, JSON.stringify(toSave));
    } catch {
      // silent fail — settings changed in memory, best-effort persist
    }
  },

  addWhitelistedApp: async (app) => {
    const current = get().whitelistedApps;
    if (current.some((a) => a.packageName === app.packageName)) return;
    const next = [...current, app];
    await get().update('whitelistedApps', next);
  },

  removeWhitelistedApp: async (packageName) => {
    const current = get().whitelistedApps;
    const next = current.filter((a) => a.packageName !== packageName);
    await get().update('whitelistedApps', next);
  },
}));
