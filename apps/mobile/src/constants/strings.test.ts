import { expect, test } from 'bun:test';
import { authErrorText, latencyLabel, Strings } from './strings';

test('latencyLabel buckets ping into Cepat/Normal/Jauh', () => {
  expect(latencyLabel(40)).toBe(Strings.latency.fast);
  expect(latencyLabel(100)).toBe(Strings.latency.normal);
  expect(latencyLabel(249)).toBe(Strings.latency.normal);
  expect(latencyLabel(250)).toBe(Strings.latency.far);
  expect(latencyLabel(null)).toBe(Strings.latency.far);
});

test('authErrorText maps API codes to plain messages', () => {
  expect(authErrorText('SUBSCRIPTION_INVALID')).toBe('ID tidak ditemukan. Periksa lagi, ya.');
  expect(authErrorText('PAIRING_TOKEN_USED')).toBe(Strings.auth.qrBad);
  expect(authErrorText('NETWORK_ERROR')).toBe(Strings.auth.network);
  expect(authErrorText('SOMETHING_ELSE')).toBe(Strings.auth.generic);
});
