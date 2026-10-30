import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ONION_URL } from '../index.js';
import { findTorrents, siteFor, siteUrl } from '../lib/connection.js';
import { DEFAULTS } from '../lib/settings.js';
import { NO_RESULTS, rawTorrent, startServer } from './helpers.js';

const fixture = fs.readFileSync(new URL('./fixtures/classic-search.html', import.meta.url), 'utf8');

test('site URLs are normalized and validated', () => {
  assert.equal(siteUrl('thepiratebay0.org'), 'https://thepiratebay0.org');
  assert.equal(siteUrl(' https://mirror.example/tpb/ '), 'https://mirror.example/tpb');
  assert.equal(siteUrl('http://127.0.0.1:8080'), 'http://127.0.0.1:8080');
  assert.throws(() => siteUrl('ftp://mirror.example'), /isn't an http or https URL/);
  assert.throws(() => siteUrl('not a url'), /isn't a valid site URL/);
});

test('siteFor picks the .onion site, a chosen site, or the API', () => {
  assert.equal(siteFor({ onion: false, site: '' }), null);
  assert.equal(siteFor({ onion: false, site: 'thepiratebay0.org' }), 'https://thepiratebay0.org');
  assert.equal(siteFor({ onion: true, site: '' }), ONION_URL);
  assert.throws(() => siteFor({ onion: true, site: 'thepiratebay0.org' }), /not both/);
});

test('findTorrents uses the API by default and the chosen site when set', async (t) => {
  const server = await startServer((req) =>
    req.url.startsWith('/q.php') ? { json: [rawTorrent()] } : req.url.startsWith('/search/') ? { text: fixture } : { json: NO_RESULTS }
  );
  t.after(server.close);

  const fromApi = await findTorrents('x', { category: 'all', config: { ...DEFAULTS }, api: server.url });
  assert.equal(fromApi.length, 1);
  const fromSite = await findTorrents('x', { category: 'all', config: { ...DEFAULTS, site: server.url } });
  assert.equal(fromSite.length, 3);
  assert.deepEqual(server.requests.map((r) => r.url), ['/q.php?q=x&cat=0', '/search/x/0/99/0']);
});

test('the .onion site without Tor is an error, not a different search', async () => {
  await assert.rejects(
    findTorrents('x', { category: 'all', config: { ...DEFAULTS, onion: true } }),
    /needs Tor/
  );
});
