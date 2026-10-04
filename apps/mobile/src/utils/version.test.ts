import { expect, test } from 'bun:test';
import { isNewerVersion } from './version';

test('isNewerVersion compares dotted versions numerically', () => {
  expect(isNewerVersion('2.1.0', '2.0.0')).toBe(true);
  expect(isNewerVersion('2.10.0', '2.9.0')).toBe(true);
  expect(isNewerVersion('2.0.0', '2.0.0')).toBe(false);
  expect(isNewerVersion('2.0', '2.0.0')).toBe(false);
  expect(isNewerVersion('1.9.9', '2.0.0')).toBe(false);
});
