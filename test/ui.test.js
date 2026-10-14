import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import { stripAnsi } from '../lib/format.js';
import { DEFAULTS, loadSettings } from '../lib/settings.js';
import { App } from '../lib/ui.js';
import { rawTorrent, startServer, tempDir } from './helpers.js';

const dir = tempDir();
process.env.MAGSEARCH_CONFIG = path.join(dir, 'settings.json');
delete process.env.OPENSUBTITLES_API_KEY;

function fakeTerminal({ cols = 100, rows = 24 } = {}) {
  const input = new PassThrough();
  input.isTTY = true;
  input.rawMode = false;
  input.setRawMode = (on) => {
    input.rawMode = on;
    return input;
  };
  const term = { input, written: '' };
  term.output = new Writable({
    write(chunk, _enc, cb) {
      term.written += chunk;
      cb();
    }
  });
  Object.assign(term.output, { isTTY: true, columns: cols, rows });
  // The most recent full frame, as plain text lines.
  term.screen = () => {
    const start = term.written.lastIndexOf('\x1b[H');
    return stripAnsi(term.written.slice(start + 3)).split('\r\n');
  };
  term.text = () => term.screen().join('\n');
  term.press = (keys) => input.write(keys);
  term.waitFor = async (check, label = check.toString()) => {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      if (check(term.text())) return;
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.fail(`timed out waiting for ${label}\n--- screen ---\n${term.text()}`);
  };
  return term;
}

async function mockApi() {
  return startServer((req) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/precompiled/')) return { json: [rawTorrent({ id: '1', name: 'Top Torrent' })] };
    if (url.searchParams.get('q') === 'nothing') return { json: [] };
    return {
      json: [
        rawTorrent({ id: '10', name: 'Small Seeded Thing', seeders: '5' }),
        rawTorrent({ id: '11', name: 'Big Buck Bunny 1080p', seeders: '50', info_hash: 'DD8255ECDC7CA55FB0BBF81323D87062DB1F6D1C' })
      ]
    };
  });
}

function startApp(term, server, { settings = {}, ...options } = {}) {
  const app = new App({
    settings: { ...DEFAULTS, health: false, api: server.url, ...settings },
    input: term.input,
    output: term.output,
    ...options
  });
  return { app, done: app.start() };
}

test('searches on launch, sorts by seeders and quits cleanly', async (t) => {
  const server = await mockApi();
  t.after(server.close);
  const term = fakeTerminal();
  const { done } = startApp(term, server, { query: 'bunny', category: 'video' });

  await term.waitFor((s) => s.includes('Big Buck Bunny'), 'results');
  const rows = term.screen();
  const first = rows.findIndex((l) => l.includes('Big Buck Bunny'));
  const second = rows.findIndex((l) => l.includes('Small Seeded Thing'));
  assert.ok(first < second, 'most seeded first');
  assert.match(rows[first], /^ ›/);
  assert.match(term.text(), /2 results for “bunny” · video · by seeders/);
  assert.match(term.text(), /thepiratebay\.org\/description\.php\?id=11/);
  assert.equal(server.requests[0].url, '/q.php?q=bunny&cat=200');
  assert.equal(term.input.rawMode, true);

  term.press('q');
  await done;
  assert.equal(term.input.rawMode, false);
  assert.ok(term.written.endsWith('\x1b[?1049l'), 'left the alternate screen');
});

test('shows the top 100 on launch, then searches what you type', async (t) => {
  const server = await mockApi();
  t.after(server.close);
  const term = fakeTerminal();
  const { done } = startApp(term, server);

  await term.waitFor((s) => s.includes('Top Torrent'), 'top 100');
  assert.equal(server.requests[0].url, '/precompiled/data_top100_all.json');

  term.press('nothing\r');
  await term.waitFor((s) => s.includes('No results for “nothing”.'), 'no results message');
  term.press('\x7f'.repeat(7) + 'bunny\r');
  await term.waitFor((s) => s.includes('Big Buck Bunny'), 'new results');
  term.press('\t');
  await term.waitFor(() => server.requests.some((r) => r.url === '/q.php?q=bunny&cat=100'), 'category search');
  assert.match(term.text(), /results for “bunny” · audio/);

  term.press('q');
  await done;
});

test('settings are edited in the app and saved', async (t) => {
  const server = await mockApi();
  t.after(server.close);
  const term = fakeTerminal({ rows: 30 });
  const { done } = startApp(term, server, { query: 'bunny' });

  await term.waitFor((s) => s.includes('Big Buck Bunny'), 'results');
  term.press(',');
  await term.waitFor((s) => s.includes('OpenSubtitles API key'), 'settings screen');
  term.press('jjjjjjj\r');
  term.press('MY-SECRET-KEY\r');
  await term.waitFor((s) => s.includes('••••••••-KEY'), 'masked key');
  assert.ok(!term.text().includes('MY-SECRET-KEY'));
  term.press('k ');
  await term.waitFor((s) => s.includes('‹ en ›'), 'subtitle language changed');

  const saved = loadSettings();
  assert.equal(saved.opensubtitlesApiKey, 'MY-SECRET-KEY');
  assert.equal(saved.subtitles, 'en');
  assert.equal(saved.api, server.url);

  term.press(',q');
  await done;
});

test('enter streams the selected torrent with peerflix and comes back', async (t) => {
  const server = await mockApi();
  t.after(server.close);
  const out = path.join(dir, 'peerflix-args.json');
  const script = path.join(dir, 'fake-peerflix.cjs');
  fs.writeFileSync(script, `require('fs').writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)))`);
  process.env.MAGSEARCH_PEERFLIX = script;
  t.after(() => delete process.env.MAGSEARCH_PEERFLIX);

  const term = fakeTerminal();
  const { done } = startApp(term, server, {
    query: 'bunny',
    settings: { player: 'mpv', blocklist: '', subtitles: 'en' }
  });
  await term.waitFor((s) => s.includes('Big Buck Bunny'), 'results');
  term.press('\r');
  await term.waitFor((s) => s.includes('Stopped streaming.'), 'back in the app');

  const args = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.match(args[0], /^magnet:\?xt=urn:btih:DD8255ECDC7CA55FB0BBF81323D87062DB1F6D1C&dn=Big%20Buck%20Bunny/);
  assert.deepEqual(args.slice(1), ['--mpv', '--remove']);
  assert.match(term.written, /Subtitles skipped: add your OpenSubtitles API key/);
  assert.equal(term.input.rawMode, true);

  term.press('q');
  await done;
});
