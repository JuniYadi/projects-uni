import { expect, test } from 'bun:test';
import { authErrorText, latencyLabel, Strings } from './strings';

test('latencyLabel buckets ping into Cepat/Normal/Jauh with ms detail', () => {
  expect(latencyLabel(40)).toBe(`${Strings.latency.fast} · 40 ms`);
  expect(latencyLabel(100)).toBe(`${Strings.latency.normal} · 100 ms`);
  expect(latencyLabel(249)).toBe(`${Strings.latency.normal} · 249 ms`);
  expect(latencyLabel(250)).toBe(`${Strings.latency.far} · 250 ms`);
  expect(latencyLabel(null)).toBe(Strings.latency.far);
});

test('authErrorText maps API codes to plain messages', () => {
  expect(authErrorText('SUBSCRIPTION_INVALID')).toBe('ID tidak ditemukan. Periksa lagi, ya.');
  expect(authErrorText('PAIRING_TOKEN_USED')).toBe(Strings.auth.qrBad);
  expect(authErrorText('NETWORK_ERROR')).toBe(Strings.auth.network);
  expect(authErrorText('SOMETHING_ELSE')).toBe(Strings.auth.generic);
});
