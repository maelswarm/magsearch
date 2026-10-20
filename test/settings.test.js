import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULTS, configPath, loadSettings, saveSettings } from '../lib/settings.js';
import { tempDir } from './helpers.js';

test('missing settings file gives the defaults', () => {
  assert.deepEqual(loadSettings(path.join(tempDir(), 'nope.json')), { ...DEFAULTS });
});

test('settings round-trip, creating the folder', () => {
  const file = path.join(tempDir(), 'nested', 'settings.json');
  saveSettings({ ...DEFAULTS, player: 'mpv', opensubtitlesApiKey: 'abc', extra: 'dropped' }, file);
  const loaded = loadSettings(file);
  assert.equal(loaded.player, 'mpv');
  assert.equal(loaded.opensubtitlesApiKey, 'abc');
  assert.equal('extra' in JSON.parse(fs.readFileSync(file, 'utf8')), false);
});

test('unknown keys, wrong types and unknown players are ignored', () => {
  const file = path.join(tempDir(), 'settings.json');
  fs.writeFileSync(
    file,
    JSON.stringify({ socksPort: '1081', health: false, player: 'winamp', connection: 'vpn', bogus: 1 })
  );
  const loaded = loadSettings(file);
  assert.equal(loaded.socksPort, DEFAULTS.socksPort);
  assert.equal(loaded.connection, 'direct');
  assert.equal(loaded.health, false);
  assert.equal(loaded.player, DEFAULTS.player);
  assert.equal('bogus' in loaded, false);
});

test('a settings file saved with a byte order mark still loads', () => {
  const file = path.join(tempDir(), 'settings.json');
  fs.writeFileSync(file, '﻿' + JSON.stringify({ player: 'mpv' }));
  assert.equal(loadSettings(file).player, 'mpv');
});

test('a corrupt settings file is reported', () => {
  const file = path.join(tempDir(), 'settings.json');
  fs.writeFileSync(file, '{ not json');
  assert.throws(() => loadSettings(file), /Couldn't read/);
});

test('MAGSEARCH_CONFIG overrides the settings location', (t) => {
  const previous = process.env.MAGSEARCH_CONFIG;
  t.after(() => {
    if (previous === undefined) delete process.env.MAGSEARCH_CONFIG;
    else process.env.MAGSEARCH_CONFIG = previous;
  });
  process.env.MAGSEARCH_CONFIG = '/tmp/custom.json';
  assert.equal(configPath(), '/tmp/custom.json');
  delete process.env.MAGSEARCH_CONFIG;
  assert.match(configPath(), /magsearch[\\/]settings\.json$/);
});
