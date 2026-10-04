import { expect, test } from 'bun:test';
import { latencyLabel, Strings } from './strings';

test('latencyLabel buckets ping into Cepat/Normal/Jauh', () => {
  expect(latencyLabel(40)).toBe(Strings.latency.fast);
  expect(latencyLabel(100)).toBe(Strings.latency.normal);
  expect(latencyLabel(249)).toBe(Strings.latency.normal);
  expect(latencyLabel(250)).toBe(Strings.latency.far);
  expect(latencyLabel(null)).toBe(Strings.latency.far);
});
