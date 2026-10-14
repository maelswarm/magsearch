// Settings live in a JSON file in the user's config folder so they survive
// upgrades and don't need sudo to edit:
//   Windows:     %APPDATA%\magsearch\settings.json
//   macOS/Linux: $XDG_CONFIG_HOME/magsearch/settings.json (~/.config by default)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { API_URL } from '../index.js';

export const PLAYERS = [
  'none',
  'vlc',
  'mpv',
  'mplayer',
  'smplayer',
  'mpchc',
  'potplayer',
  'airplay',
  'webplay',
  'omx',
  'jack'
];

export const DEFAULTS = Object.freeze({
  player: 'vlc',
  path: '', // empty = temp folder
  remove: true, // delete temp downloads when peerflix exits
  blocklist: 'auto', // 'auto' = bundled btlev1, '' = off, or a file path
  health: true, // live seeder/leecher counts from trackers
  showMagnet: false,
  subtitles: 'none', // OpenSubtitles language code, e.g. 'en'
  opensubtitlesApiKey: '',
  opensubtitlesUsername: '',
  opensubtitlesPassword: '',
  proxy: false, // send requests through a SOCKS5 proxy (Tor)
  onion: false, // search The Pirate Bay's .onion site through the proxy
  proxyHost: '127.0.0.1',
  proxyPort: 9050,
  api: API_URL
});

export function configPath() {
  if (process.env.MAGSEARCH_CONFIG) return process.env.MAGSEARCH_CONFIG;
  const base =
    process.platform === 'win32'
      ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
      : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'magsearch', 'settings.json');
}

// Unknown keys and values of the wrong type are dropped. Throws if the file
// exists but isn't valid JSON, so the caller can tell the user.
export function loadSettings(file = configPath()) {
  const settings = { ...DEFAULTS };
  let saved;
  try {
    // Strip the byte order mark some Windows editors add to UTF-8 files.
    saved = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch (err) {
    if (err.code === 'ENOENT') return settings;
    throw new Error(`Couldn't read ${file}: ${err.message}`, { cause: err });
  }
  for (const [key, value] of Object.entries(saved ?? {})) {
    if (Object.hasOwn(DEFAULTS, key) && typeof value === typeof DEFAULTS[key]) {
      settings[key] = value;
    }
  }
  if (!PLAYERS.includes(settings.player)) settings.player = DEFAULTS.player;
  return settings;
}

export function saveSettings(settings, file = configPath()) {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) out[key] = settings[key];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // The file can hold an API key and password, so keep it private.
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n', { mode: 0o600 });
}
