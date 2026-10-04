import { expect, test } from 'bun:test';
import { breakpointFor, colors } from './index';

test('breakpointFor picks phone/tablet/desktop at the boundaries', () => {
  expect(breakpointFor(320)).toBe('phone');
  expect(breakpointFor(599)).toBe('phone');
  expect(breakpointFor(600)).toBe('tablet');
  expect(breakpointFor(1023)).toBe('tablet');
  expect(breakpointFor(1024)).toBe('desktop');
});

test('light and dark define the same color tokens', () => {
  expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
});
