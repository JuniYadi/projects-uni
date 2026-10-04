import { expect, test } from 'bun:test';
import { toUiStatus } from './connection-ui';

const base = { status: 'disconnected', error: null, dropped: false } as const;

test('maps store state to the 5 Beranda states', () => {
  expect(toUiStatus(base)).toBe('idle');
  expect(toUiStatus({ ...base, status: 'connecting' })).toBe('connecting');
  expect(toUiStatus({ ...base, status: 'disconnecting' })).toBe('connecting');
  expect(toUiStatus({ ...base, status: 'connected' })).toBe('connected');
  expect(toUiStatus({ ...base, error: 'boom' })).toBe('failed');
  expect(toUiStatus({ ...base, dropped: true })).toBe('dropped');
});

test('connected wins over stale error/dropped flags; dropped wins over error', () => {
  expect(toUiStatus({ status: 'connected', error: 'x', dropped: true })).toBe('connected');
  expect(toUiStatus({ ...base, error: 'x', dropped: true })).toBe('dropped');
});
