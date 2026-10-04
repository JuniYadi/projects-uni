import type { VpnProfile } from '@/types/vpn';

export type LocationFilter = {
  query: string;
  region: string | 'all';
  sortBy: 'ping' | 'name';
  show: 'all' | 'favorites';
};

export const DEFAULT_LOCATION_FILTER: LocationFilter = { query: '', region: 'all', sortBy: 'ping', show: 'all' };

/** Number of non-default filter choices (search text not counted; it has its own box). */
export function activeFilterCount(f: LocationFilter): number {
  return (f.region !== 'all' ? 1 : 0) + (f.sortBy !== 'ping' ? 1 : 0) + (f.show !== 'all' ? 1 : 0);
}

const byPing = (a: VpnProfile, b: VpnProfile) => (a.ping ?? Infinity) - (b.ping ?? Infinity);

export function filterLocations(list: VpnProfile[], f: LocationFilter, favoriteIds: string[]): VpnProfile[] {
  const q = f.query.trim().toLowerCase();
  const out = list.filter(
    (p) =>
      (f.region === 'all' || p.region === f.region) &&
      (f.show === 'all' || favoriteIds.includes(p.id)) &&
      (!q || p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)),
  );
  return out.sort(f.sortBy === 'name' ? (a, b) => a.name.localeCompare(b.name) : byPing);
}

/** Fastest location that has actually been measured; null while nothing is measured yet. */
export function recommended(list: VpnProfile[]): VpnProfile | null {
  const measured = list.filter((p) => p.ping !== null).sort(byPing);
  return measured[0] ?? null;
}
