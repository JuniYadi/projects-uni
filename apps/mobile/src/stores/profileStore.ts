import { create } from 'zustand';
import type { VpnProfile, FilterState } from '@/types/vpn';
import { useConnectionStore } from '@/stores/connectionStore';
import { api } from '@/services/api';
import { pingHost } from '@/services/pingService';
import * as storage from '@/services/storageService';
import { resolveCountryCode, resolveCountryName } from '@univpn/shared';

// ponytail: dev bypass fallback
const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === '1'

const MOCK_PROFILES: VpnProfile[] = [
  { id: 'id-1', name: 'Indonesia', country: 'Indonesia', countryCode: 'ID', city: 'Jakarta', region: 'Asia', protocol: 'wireguard', port: 51820, load: 40, ping: 18, encryption: 'AES-256-GCM', serverAddress: 'id-1.vpn.example.com', serverIp: '203.0.113.28', latitude: -6.2088, longitude: 106.8456 },
  { id: 'sg-1', name: 'Singapore', country: 'Singapore', countryCode: 'SG', city: 'Singapore', region: 'Asia', protocol: 'wireguard', port: 51820, load: 40, ping: 32, encryption: 'AES-256-GCM', serverAddress: 'sg-1.vpn.example.com', serverIp: '203.0.113.42', latitude: 1.3521, longitude: 103.8198 },
  { id: 'hk-1', name: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', region: 'Asia', protocol: 'wireguard', port: 51820, load: 40, ping: 74, encryption: 'AES-256-GCM', serverAddress: 'hk-1.vpn.example.com', serverIp: '203.0.113.84', latitude: 22.3193, longitude: 114.1694 },
  { id: 'jp-1', name: 'Japan', country: 'Japan', countryCode: 'JP', city: 'Tokyo', region: 'Asia', protocol: 'wireguard', port: 51820, load: 40, ping: 120, encryption: 'AES-256-GCM', serverAddress: 'jp-1.vpn.example.com', serverIp: '203.0.113.130', latitude: 35.6762, longitude: 139.6503 },
  { id: 'us-la', name: 'Los Angeles', country: 'United States', countryCode: 'US', city: 'Los Angeles', region: 'Amerika', protocol: 'wireguard', port: 51820, load: 40, ping: 210, encryption: 'AES-256-GCM', serverAddress: 'us-la.vpn.example.com', serverIp: '203.0.113.20', latitude: 34.0522, longitude: -118.2437 },
  { id: 'us-dal', name: 'Dallas', country: 'United States', countryCode: 'US', city: 'Dallas', region: 'Amerika', protocol: 'wireguard', port: 51820, load: 40, ping: 260, encryption: 'AES-256-GCM', serverAddress: 'us-dal.vpn.example.com', serverIp: '203.0.113.70', latitude: 32.7767, longitude: -96.797 },
];


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
  lat?: number;
  lng?: number;
  lang?: number;
  long?: number;
}): VpnProfile {
  const countryCode = resolveCountryCode(apiProfile);
  const country =
    apiProfile.country && !['US', 'HK', 'ID', 'SG', 'JP', 'NL', 'DE', 'AMERIKA'].includes(apiProfile.country.toUpperCase())
      ? apiProfile.country
      : resolveCountryName(countryCode) || apiProfile.country || apiProfile.region;
  if (process.env.EXPO_PUBLIC_APP_DEBUG === 'true') {
    console.log(`[ProfileStore] Raw profile keys for ${apiProfile.serverName}:`, Object.keys(apiProfile));
    console.log(`[ProfileStore] Raw profile object for ${apiProfile.serverName}:`, JSON.stringify(apiProfile, null, 2));
  }

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
    latitude: apiProfile.latitude ?? apiProfile.lat ?? apiProfile.lang,
    longitude: apiProfile.longitude ?? apiProfile.lng ?? apiProfile.long,
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
  favoriteIds: string[];
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
  toggleFavorite: (id: string) => void;
  _runPings: (signal: AbortSignal) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  filteredProfiles: [],
  regions: [],
  activeFilter: DEFAULT_FILTER,
  selectedProfileId: null,
  favoriteIds: [],
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
        if (process.env.EXPO_PUBLIC_APP_DEBUG === 'true') {
          console.log('[ProfileStore] Raw API /profiles response:', JSON.stringify(res, null, 2));
        }
        // Filter strictly for WireGuard profiles since client engine is WireGuard-only
        rawProfiles = res.profiles
          .filter((p) => p.protocol?.toUpperCase() === 'WIREGUARD')
          .map(mapProfile);
        regions = [...new Set(rawProfiles.map((p) => p.region))] as string[];
      }
      if (signal.aborted) return
      set({ profiles: rawProfiles, regions, loading: false });
      get().applyFilter();

      // Restore persisted selection and drop it if the server no longer exists
      await get().loadSelectedProfileId();
      set({ favoriteIds: await storage.getFavoriteIds() });

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

  toggleFavorite: (id) => {
    const { favoriteIds } = get();
    const next = favoriteIds.includes(id) ? favoriteIds.filter((f) => f !== id) : [...favoriteIds, id];
    set({ favoriteIds: next });
    storage.setFavoriteIds(next).catch(() => {});
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
