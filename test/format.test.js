import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createStyle,
  formatAge,
  formatSize,
  padStart,
  sanitize,
  stringWidth,
  stripAnsi,
  truncate,
  truncateStart
} from '../lib/format.js';

test('formatSize uses binary units with sensible precision', () => {
  assert.equal(formatSize(0), '0 B');
  assert.equal(formatSize(1023), '1023 B');
  assert.equal(formatSize(1536), '1.50 KiB');
  assert.equal(formatSize(703 * 1024 ** 2), '703 MiB');
  assert.equal(formatSize(19.2 * 1024 ** 3), '19.2 GiB');
  assert.equal(formatSize(3.14 * 1024 ** 3), '3.14 GiB');
});

test('formatAge is short and relative', () => {
  const now = 1_700_000_000_000;
  const ago = (s) => now / 1000 - s;
  assert.equal(formatAge(0, now), '');
  assert.equal(formatAge(ago(30), now), 'now');
  assert.equal(formatAge(ago(5 * 60), now), '5m');
  assert.equal(formatAge(ago(3 * 3600), now), '3h');
  assert.equal(formatAge(ago(4 * 86400), now), '4d');
  assert.equal(formatAge(ago(90 * 86400), now), '3mo');
  assert.equal(formatAge(ago(800 * 86400), now), '2y');
});

test('sanitize strips terminal escapes and control characters from names', () => {
  assert.equal(sanitize('evil\x1b[2Jname\x07\r\nhere'), 'evil [2Jname here');
  assert.equal(sanitize('a‮b'), 'a b');
  assert.equal(sanitize(null), '');
});

test('width-aware truncation handles wide characters', () => {
  assert.equal(stringWidth('abc'), 3);
  assert.equal(stringWidth('日本語'), 6);
  assert.equal(stringWidth('\x1b[32mok\x1b[39m'), 2);
  assert.equal(truncate('hello world', 8), 'hello w…');
  assert.equal(truncate('hello', 8), 'hello');
  assert.equal(stringWidth(truncate('日本語のタイトル', 7)), 7);
  assert.equal(truncateStart('blade runner 2049', 8), '…er 2049');
  assert.equal(padStart('日本', 6), '  日本');
});

test('styles can be switched off', () => {
  const on = createStyle(true);
  const off = createStyle(false);
  assert.equal(on.green('x'), '\x1b[32mx\x1b[39m');
  assert.equal(off.green('x'), 'x');
  assert.equal(off.highlight + off.reset, '');
  assert.equal(stripAnsi(on.bold(on.red('hi'))), 'hi');
});
