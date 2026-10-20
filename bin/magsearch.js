#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { CATEGORIES, categoryLabel, resolveCategory } from '../index.js';
import { TOR_HOST, findTorrents } from '../lib/connection.js';
import { createStyle, formatAge, formatSize, padEnd, padStart, sanitize, shouldUseColor, truncate } from '../lib/format.js';
import { DEFAULTS, configPath, loadSettings, saveSettings } from '../lib/settings.js';
import { App } from '../lib/ui.js';
import { VERSION } from '../lib/version.js';

const HELP = `magsearch ${VERSION}
Search The Pirate Bay from your terminal and stream magnet links with peerflix.

Usage
  magsearch [query] [options]

Options
  -c, --category <name>   ${Object.keys(CATEGORIES).join(', ')} (default: all)
  -t, --tor               connect through Tor on ${TOR_HOST}:${DEFAULTS.torPort}
      --tor-port <port>   connect through Tor on this port (Tor Browser uses 9150)
      --socks             connect through a SOCKS5 proxy on ${DEFAULTS.socksHost}:${DEFAULTS.socksPort}
      --socks-host <host> SOCKS proxy host (default: ${DEFAULTS.socksHost})
      --socks-port <port> SOCKS proxy port (default: ${DEFAULTS.socksPort})
      --api <url>         Pirate Bay API (default: ${DEFAULTS.api})
  -l, --list              print results as a table and exit
      --json              print results as JSON and exit
  -n, --limit <n>         how many results to print (default: 20 for --list,
                          all for --json)
      --subtitles-key <key>
                          save your OpenSubtitles.com API key
      --config            print where settings are saved
  -h, --help              show this help
  -v, --version           show the version

Examples
  magsearch
  magsearch blade runner -c video
  magsearch "blade runner" --tor
  magsearch "blade runner" --tor-port 9150
  magsearch "blade runner" --socks --socks-host 10.0.0.2
  magsearch ubuntu --json | jq -r '.[0].magnet'

Tor and SOCKS flags apply to this run only. The ports and host default to
your settings. Use one or the other, not both.

In the app, press ? for keys and , for settings (player, subtitles, Tor,
SOCKS proxy, the .onion site…).
Stream with peerflix (npm install -g peerflix), or press o to send a magnet
to your own torrent client.`;

function fail(message) {
  console.error(`magsearch: ${message}`);
  process.exit(1);
}

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      category: { type: 'string', short: 'c' },
      keyword: { type: 'string', short: 'k' }, // old name for --category
      tor: { type: 'boolean', short: 't' },
      'tor-port': { type: 'string' },
      socks: { type: 'boolean' },
      'socks-host': { type: 'string' },
      'socks-port': { type: 'string' },
      api: { type: 'string' },
      list: { type: 'boolean', short: 'l' },
      json: { type: 'boolean' },
      limit: { type: 'string', short: 'n' },
      'subtitles-key': { type: 'string' },
      config: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' }
    }
  });
} catch (err) {
  fail(`${err.message}\nRun "magsearch --help" for usage.`);
}
const { values: flags, positionals } = args;

if (flags.help) {
  console.log(HELP);
  process.exit(0);
}
if (flags.version) {
  console.log(VERSION);
  process.exit(0);
}
if (flags.config) {
  console.log(configPath());
  process.exit(0);
}

let settings;
try {
  settings = loadSettings();
} catch (err) {
  console.error(`magsearch: ${err.message}\nUsing default settings for now.`);
  settings = { ...DEFAULTS };
}

if (flags['subtitles-key'] !== undefined) {
  settings.opensubtitlesApiKey = flags['subtitles-key'].trim();
  try {
    saveSettings(settings);
  } catch (err) {
    fail(`couldn't save settings: ${err.message}`);
  }
  console.log(`Saved your OpenSubtitles API key to ${configPath()}`);
  if (!positionals.length) process.exit(0);
}

let category;
try {
  category = resolveCategory(flags.category ?? flags.keyword);
} catch (err) {
  fail(err.message);
}

// Flags apply to this session only; they're never written to the settings file.
const overrides = {};
if (flags.api) overrides.api = flags.api;

function parsePort(flag) {
  const value = flags[flag];
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`--${flag}: "${value}" isn't a valid port.`);
  return port;
}

// --tor-port implies --tor, and --socks-host / --socks-port imply --socks.
const useTor = flags.tor || flags['tor-port'] !== undefined;
const useSocks = flags.socks || flags['socks-host'] !== undefined || flags['socks-port'] !== undefined;
if (useTor && useSocks) fail('use either Tor (--tor, --tor-port) or a SOCKS proxy (--socks, --socks-host, --socks-port), not both.');
if (useTor) overrides.connection = 'tor';
if (useSocks) overrides.connection = 'socks';
if (flags['tor-port'] !== undefined) overrides.torPort = parsePort('tor-port');
if (flags['socks-host'] !== undefined) overrides.socksHost = flags['socks-host'];
if (flags['socks-port'] !== undefined) overrides.socksPort = parsePort('socks-port');

const query = positionals.join(' ').trim();
const config = { ...settings, ...overrides };
const interactive = process.stdin.isTTY && process.stdout.isTTY;

if (flags.json || flags.list || !interactive) {
  await printResults();
} else {
  const app = new App({ settings, overrides, query, category });
  process.on('uncaughtException', (err) => {
    app.detach();
    console.error(err);
    process.exit(1);
  });
  await app.start();
  process.exit(0);
}

async function printResults() {
  let results;
  try {
    results = await findTorrents(query, { category, config });
  } catch (err) {
    fail(err.message);
  }
  results.sort((a, b) => b.seeders - a.seeders);

  if (flags.json) {
    const limit = flags.limit ? Number(flags.limit) : results.length;
    console.log(JSON.stringify(results.slice(0, limit), null, 2));
    return;
  }

  const limit = Number(flags.limit ?? 20) || 20;
  const s = createStyle(shouldUseColor(process.stdout));
  const width = Math.max(60, (process.stdout.columns || 100) - 1);
  const nameWidth = width - 36;
  if (!results.length) {
    console.error('No results.');
    process.exitCode = 1;
    return;
  }
  console.log(s.dim(`${padStart('SE', 6)} ${padStart('LE', 6)} ${padStart('SIZE', 9)} ${padEnd('AGE', 4)}  ${'NAME'}`));
  for (const t of results.slice(0, limit)) {
    console.log(
      `${s.green(padStart(String(t.seeders), 6))} ${s.red(padStart(String(t.leechers), 6))} ` +
        `${padStart(formatSize(t.size), 9)} ${s.dim(padEnd(formatAge(t.added), 4))}  ` +
        `${truncate(sanitize(t.name), nameWidth)} ${s.dim(`(${categoryLabel(t.category, { short: true })})`)}`
    );
  }
  if (results.length > limit) console.log(s.dim(`… ${results.length - limit} more. Use -n to show more, or --json for magnet links.`));
}
