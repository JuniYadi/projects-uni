import { expect, test } from 'bun:test';
import type { VpnProfile } from '@/types/vpn';
import { DEFAULT_LOCATION_FILTER as D, activeFilterCount, filterLocations, recommended } from './locations';

const p = (id: string, name: string, region: string, ping: number | null) =>
  ({ id, name, country: name, region, ping }) as VpnProfile;
const list = [p('a', 'Japan', 'Asia', 120), p('b', 'Dallas', 'Amerika', 260), p('c', 'Indonesia', 'Asia', 18), p('d', 'Hong Kong', 'Asia', null)];

test('sorts by ping with unmeasured last, or by name', () => {
  expect(filterLocations(list, D, []).map((x) => x.id)).toEqual(['c', 'a', 'b', 'd']);
  expect(filterLocations(list, { ...D, sortBy: 'name' }, []).map((x) => x.id)).toEqual(['b', 'd', 'c', 'a']);
});

test('filters by region, favorites and search text', () => {
  expect(filterLocations(list, { ...D, region: 'Amerika' }, []).map((x) => x.id)).toEqual(['b']);
  expect(filterLocations(list, { ...D, show: 'favorites' }, ['a', 'c']).map((x) => x.id)).toEqual(['c', 'a']);
  expect(filterLocations(list, { ...D, query: ' hong ' }, []).map((x) => x.id)).toEqual(['d']);
  expect(filterLocations(list, { ...D, query: 'zzz' }, [])).toEqual([]);
});

test('recommended is the fastest measured location, null when none measured', () => {
  expect(recommended(list)?.id).toBe('c');
  expect(recommended([p('d', 'Hong Kong', 'Asia', null)])).toBeNull();
  expect(recommended([])).toBeNull();
});

test('activeFilterCount ignores search text', () => {
  expect(activeFilterCount({ ...D, query: 'x' })).toBe(0);
  expect(activeFilterCount({ query: '', region: 'Asia', sortBy: 'name', show: 'favorites' })).toBe(3);
});
