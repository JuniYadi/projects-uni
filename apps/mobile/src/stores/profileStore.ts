import { create } from 'zustand';
import type { VpnProfile, FilterState } from '@/types/vpn';
import { useConnectionStore } from '@/stores/connectionStore';
import { api } from '@/services/api';
import { withLivePing } from '@/services/pingService';

// ponytail: dev bypass fallback
const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === '1'

const MOCK_PROFILES: VpnProfile[] = [
  { id: 'sg-1', name: 'Singapore 1', country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Asia', protocol: 'wireguard', port: 51820, load: 45, ping: 12, encryption: 'AES-256-GCM', serverAddress: 'sg1.vpn.example.com', serverIp: '203.0.113.10' },
  { id: 'sg-2', name: 'Singapore 2', country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Asia', protocol: 'openvpn', port: 1194, load: 30, ping: 15, encryption: 'AES-256-GCM', serverAddress: 'sg2.vpn.example.com', serverIp: '203.0.113.11' },
  { id: 'jp-1', name: 'Tokyo 1', country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Asia', protocol: 'wireguard', port: 51820, load: 67, ping: 45, encryption: 'AES-256-GCM', serverAddress: 'jp1.vpn.example.com', serverIp: '203.0.113.20' },
  { id: 'jp-2', name: 'Tokyo 2', country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Asia', protocol: 'openvpn', port: 1194, load: 80, ping: 80, encryption: 'AES-256-GCM', serverAddress: 'jp2.vpn.example.com', serverIp: '203.0.113.21' },
  { id: 'hk-1', name: 'Hong Kong 1', country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', region: 'Asia', protocol: 'openvpn', port: 443, load: 55, ping: 89, encryption: 'AES-256-GCM', serverAddress: 'hk1.vpn.example.com', serverIp: '203.0.113.30' },
  { id: 'nl-1', name: 'Amsterdam 1', country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', region: 'Europe', protocol: 'wireguard', port: 51820, load: 35, ping: 120, encryption: 'AES-256-GCM', serverAddress: 'nl1.vpn.example.com', serverIp: '203.0.113.40' },
  { id: 'de-1', name: 'Frankfurt 1', country: 'Germany', countryCode: 'DE', city: 'Frankfurt', region: 'Europe', protocol: 'openvpn', port: 1194, load: 60, ping: 145, encryption: 'AES-256-GCM', serverAddress: 'de1.vpn.example.com', serverIp: '203.0.113.50' },
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
    ping: apiProfile.pingMs ?? 999,
    encryption: 'AES-256-GCM',
    serverAddress: apiProfile.hostname,
    serverIp: apiProfile.serverIp ?? apiProfile.hostname ?? apiProfile.serverName,
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
  loading: boolean;
  error: string | null;
  loadProfiles: () => Promise<void>;
  cancelLoadProfiles: () => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  applyFilter: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  filteredProfiles: [],
  regions: [],
  activeFilter: DEFAULT_FILTER,
  loading: false,
  error: null,

  loadProfiles: async () => {
    pingController?.abort()
    pingController = new AbortController()
    const signal = pingController.signal
    set({ loading: true, error: null });
    try {
      if (SKIP_AUTH) {
        // Dev bypass
        await new Promise((r) => setTimeout(r, 300));
      } else {
        const res = await api.getProfiles();
        const mapped = await withLivePing(res.profiles.map(mapProfile), signal);
        if (signal.aborted) return
        set({ profiles: mapped, loading: false });
        get().applyFilter();
        return;
      }
      const regions = [...new Set(MOCK_PROFILES.map((p) => p.region))] as string[];
      const profiles = await withLivePing(MOCK_PROFILES, signal);
      if (signal.aborted) return
      set({ profiles, regions, loading: false });
      get().applyFilter();
    } catch {
      if (!signal.aborted) set({ error: 'Failed to load servers', loading: false });
    }
  },

  cancelLoadProfiles: () => {
    pingController?.abort()
    pingController = null
  },

  setFilter: (filter) => {
    set({ activeFilter: { ...get().activeFilter, ...filter } });
    get().applyFilter();
  },

  resetFilter: () => {
    set({ activeFilter: DEFAULT_FILTER });
    get().applyFilter();
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
      result.sort((a, b) => a.ping - b.ping);
    } else if (activeFilter.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeFilter.sortBy === 'region') {
      result.sort((a, b) => a.region.localeCompare(b.region));
    }

    set({ filteredProfiles: result });
  },
}));
