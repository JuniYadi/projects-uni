import { create } from 'zustand';
import type { VpnProfile, FilterState } from '@/types/vpn';
import { useConnectionStore } from '@/stores/connectionStore';
import { api } from '@/services/api';
import { pingHost } from '@/services/pingService';
import * as storage from '@/services/storageService';

// ponytail: dev bypass fallback
const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === '1'

const MOCK_PROFILES: VpnProfile[] = [
  { id: 'sg-1', name: 'Singapore 1', country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Asia', protocol: 'wireguard', port: 51820, load: 45, ping: 12, encryption: 'AES-256-GCM', serverAddress: 'sg1.vpn.example.com', serverIp: '203.0.113.10', latitude: 1.3521, longitude: 103.8198 },
  { id: 'sg-2', name: 'Singapore 2', country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Asia', protocol: 'openvpn', port: 1194, load: 30, ping: 15, encryption: 'AES-256-GCM', serverAddress: 'sg2.vpn.example.com', serverIp: '203.0.113.11', latitude: 1.3521, longitude: 103.8198 },
  { id: 'jp-1', name: 'Tokyo 1', country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Asia', protocol: 'wireguard', port: 51820, load: 67, ping: 45, encryption: 'AES-256-GCM', serverAddress: 'jp1.vpn.example.com', serverIp: '203.0.113.20', latitude: 35.6762, longitude: 139.6503 },
  { id: 'jp-2', name: 'Tokyo 2', country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Asia', protocol: 'openvpn', port: 1194, load: 80, ping: 80, encryption: 'AES-256-GCM', serverAddress: 'jp2.vpn.example.com', serverIp: '203.0.113.21', latitude: 35.6762, longitude: 139.6503 },
  { id: 'hk-1', name: 'Hong Kong 1', country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', region: 'Asia', protocol: 'openvpn', port: 443, load: 55, ping: 89, encryption: 'AES-256-GCM', serverAddress: 'hk1.vpn.example.com', serverIp: '203.0.113.30', latitude: 22.3193, longitude: 114.1694 },
  { id: 'nl-1', name: 'Amsterdam 1', country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', region: 'Europe', protocol: 'wireguard', port: 51820, load: 35, ping: 120, encryption: 'AES-256-GCM', serverAddress: 'nl1.vpn.example.com', serverIp: '203.0.113.40', latitude: 52.3676, longitude: 4.9041 },
  { id: 'de-1', name: 'Frankfurt 1', country: 'Germany', countryCode: 'DE', city: 'Frankfurt', region: 'Europe', protocol: 'openvpn', port: 1194, load: 60, ping: 145, encryption: 'AES-256-GCM', serverAddress: 'de1.vpn.example.com', serverIp: '203.0.113.50', latitude: 50.1109, longitude: 8.6821 },
];

const COUNTRY_CODES: Record<string, string> = {
  'HONG KONG': 'HK',
  JAPAN: 'JP',
  SINGAPORE: 'SG',
  'UNITED STATES': 'US',
};

// Map API ProfileInfo → local VpnProfile
function mapProfile(apiProfile: {
  id: string;
  serverId?: string;
  serverName: string;
  hostname: string;
  protocol: 'OPENVPN' | 'WIREGUARD';
  region: string;
  provisioningStatus: string;
  country?: string;
  serverIp?: string | null;
  pingMs?: number;
  loadPercent?: number;
  latitude?: number;
  longitude?: number;
}): VpnProfile {
  const country = apiProfile.country ?? apiProfile.region;
  const countryCode = COUNTRY_CODES[country.toUpperCase()] ?? COUNTRY_CODES[apiProfile.region.toUpperCase()] ?? country;
  return {
    id: apiProfile.id,
    name: apiProfile.serverName,
    country,
    countryCode,
    city: apiProfile.region,
    region: apiProfile.region,
    protocol: apiProfile.protocol === 'WIREGUARD' ? 'wireguard' : 'openvpn',
    port: apiProfile.protocol === 'WIREGUARD' ? 51820 : 1194,
    load: apiProfile.loadPercent ?? 0,
    ping: apiProfile.pingMs ?? null,
    encryption: 'AES-256-GCM',
    serverAddress: apiProfile.hostname,
    serverIp: apiProfile.serverIp ?? apiProfile.hostname ?? apiProfile.serverName,
    latitude: apiProfile.latitude,
    longitude: apiProfile.longitude,
  };
}

const DEFAULT_FILTER: FilterState = {
  protocol: 'wireguard',
  region: 'all',
  status: 'all',
  sortBy: 'ping',
};

let pingController: AbortController | null = null

interface ProfileState {
  profiles: VpnProfile[];
  filteredProfiles: VpnProfile[];
  regions: string[];
  activeFilter: FilterState;
  selectedProfileId: string | null;
  loading: boolean;
  pinging: boolean;
  error: string | null;
  loadProfiles: () => Promise<void>;
  cancelLoadProfiles: () => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  applyFilter: () => void;
  loadSelectedProfileId: () => Promise<void>;
  setSelectedProfileId: (id: string | null) => Promise<void>;
  _runPings: (signal: AbortSignal) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  filteredProfiles: [],
  regions: [],
  activeFilter: DEFAULT_FILTER,
  selectedProfileId: null,
  loading: false,
  pinging: false,
  error: null,

  loadProfiles: async () => {
    pingController?.abort()
    pingController = new AbortController()
    const signal = pingController.signal
    set({ loading: true, error: null, pinging: false });
    try {
      let rawProfiles: VpnProfile[];
      let regions: string[];

      if (SKIP_AUTH) {
        await new Promise((r) => setTimeout(r, 300));
        rawProfiles = MOCK_PROFILES.map(p => ({ ...p }));
        regions = [...new Set(MOCK_PROFILES.map((p) => p.region))] as string[];
      } else {
        const res = await api.getProfiles();
        rawProfiles = res.profiles.map(mapProfile);
        regions = [...new Set(rawProfiles.map((p) => p.region))] as string[];
      }

      if (signal.aborted) return
      set({ profiles: rawProfiles, regions, loading: false });
      get().applyFilter();

      // Restore persisted selection and drop it if the server no longer exists
      await get().loadSelectedProfileId();

      // Phase 2: background ping
      get()._runPings(signal);
    } catch {
      if (!signal.aborted) set({ error: 'Failed to load servers', loading: false, pinging: false });
    }
  },

  _runPings: async (signal: AbortSignal) => {
    set({ pinging: true });
    if (signal.aborted) {
      set({ pinging: false });
      return;
    }

    const uniqueHosts = [...new Set(get().profiles.map(p => p.serverIp || p.serverAddress))];
    if (uniqueHosts.length === 0) {
      set({ pinging: false });
      return;
    }

    // ping-react-native does not support concurrent ICMP sessions, so run sequentially
    for (const host of uniqueHosts) {
      if (signal.aborted) break;
      const ping = await pingHost(host, signal);
      if (signal.aborted) break;
      const { profiles } = get();
      set({ profiles: profiles.map(p => (p.serverIp || p.serverAddress) === host ? { ...p, ping } : p) });
      get().applyFilter();
    }

    if (!signal.aborted) set({ pinging: false });
  },

  cancelLoadProfiles: () => {
    pingController?.abort()
    pingController = null
    set({ pinging: false });
  },

  setFilter: (filter) => {
    set({ activeFilter: { ...get().activeFilter, ...filter } });
    get().applyFilter();
  },

  resetFilter: () => {
    set({ activeFilter: DEFAULT_FILTER });
    get().applyFilter();
  },

  loadSelectedProfileId: async () => {
    const saved = await storage.getSelectedProfileId();
    const { profiles } = get();
    if (saved && profiles.some((p) => p.id === saved)) {
      set({ selectedProfileId: saved });
    } else if (saved) {
      // Stale selection — clear it silently
      set({ selectedProfileId: null });
      await storage.removeSelectedProfileId();
    }
  },

  setSelectedProfileId: async (id) => {
    set({ selectedProfileId: id });
    if (id) {
      await storage.setSelectedProfileId(id);
    } else {
      await storage.removeSelectedProfileId();
    }
  },

  applyFilter: () => {
    const { profiles, activeFilter } = get();
    let result = [...profiles];

    if (activeFilter.protocol !== 'all') {
      result = result.filter((p) => p.protocol === activeFilter.protocol);
    }
    if (activeFilter.region !== 'all') {
      result = result.filter((p) => p.region === activeFilter.region);
    }
    if (activeFilter.status === 'connected') {
      const activeProfileId = useConnectionStore.getState().profile?.id;
      result = result.filter((p) => p.id === activeProfileId);
    }

    if (activeFilter.sortBy === 'ping') {
      result.sort((a, b) => (a.ping ?? Infinity) - (b.ping ?? Infinity));
    } else if (activeFilter.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeFilter.sortBy === 'region') {
      result.sort((a, b) => a.region.localeCompare(b.region));
    }

    set({ filteredProfiles: result });
  },
}));
