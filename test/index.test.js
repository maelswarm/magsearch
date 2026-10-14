import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  categoryLabel,
  magnetLink,
  parseResults,
  resolveCategory,
  search,
  searchUrl,
  torrentUrl,
  TRACKERS
} from '../index.js';
import { NO_RESULTS, rawTorrent, startServer } from './helpers.js';

test('magnet links carry the hash, encoded name and trackers', () => {
  const link = magnetLink('ABC123', 'Blade Runner & Co', ['udp://tracker.example:1337/announce']);
  assert.equal(
    link,
    'magnet:?xt=urn:btih:ABC123&dn=Blade%20Runner%20%26%20Co&tr=udp%3A%2F%2Ftracker.example%3A1337%2Fannounce'
  );
  assert.equal(magnetLink('ABC').split('&tr=').length, TRACKERS.length + 1);
});

test('parseResults normalizes fields and drops the "no results" row', () => {
  assert.deepEqual(parseResults(NO_RESULTS), []);
  const [t] = parseResults([rawTorrent()]);
  assert.equal(t.name, 'Blade.Runner.2049.2017.1080p.BluRay.H264.AAC');
  assert.equal(t.seeders, 582);
  assert.equal(t.leechers, 115);
  assert.equal(t.size, 3370000000);
  assert.equal(t.category, 207);
  assert.equal(t.status, 'vip');
  assert.match(t.magnet, /^magnet:\?xt=urn:btih:F0F21AC2EF92698E8E9DB6E235CA77F6E05662A7&dn=/);
});

test('parseResults leaves out the adult section', () => {
  const results = parseResults([rawTorrent(), rawTorrent({ id: '2', category: '501' }), rawTorrent({ id: '3', category: '599' })]);
  assert.deepEqual(results.map((t) => t.id), ['27915016']);
});

test('parseResults skips rows without a valid info hash', () => {
  assert.deepEqual(parseResults([rawTorrent({ info_hash: 'nope' })]), []);
  assert.throws(() => parseResults({ error: 'x' }), /unexpected response/);
});

test('categories resolve, including the old keyword names', () => {
  assert.equal(resolveCategory(undefined), 'all');
  assert.equal(resolveCategory('VIDEO'), 'video');
  assert.equal(resolveCategory('applications'), 'apps');
  assert.throws(() => resolveCategory('films'), /Unknown category "films"/);
  assert.throws(() => resolveCategory('porn'), /Unknown category/);
  assert.throws(() => resolveCategory('adult'), /Unknown category/);
});

test('category labels', () => {
  assert.equal(categoryLabel(207), 'Video > HD Movies');
  assert.equal(categoryLabel(207, { short: true }), 'HD Movies');
  assert.equal(categoryLabel(299, { short: true }), 'Video Other');
  assert.equal(categoryLabel(200), 'Video');
  assert.equal(categoryLabel(0), '');
  assert.equal(categoryLabel(501), '');
});

test('website links point at thepiratebay.org (or the onion)', () => {
  assert.equal(searchUrl('blade runner', 'video'), 'https://thepiratebay.org/search.php?q=blade%20runner&cat=200');
  assert.equal(searchUrl('', 'all'), 'https://thepiratebay.org/search.php?q=top100:all');
  assert.equal(torrentUrl('42'), 'https://thepiratebay.org/description.php?id=42');
  assert.match(torrentUrl('42', { onion: true }), /^http:\/\/piratebay\w+\.onion\/description\.php\?id=42$/);
});

test('search queries the API and falls back to the top 100 for an empty query', async (t) => {
  const server = await startServer((req) => {
    if (req.url.startsWith('/q.php')) return { json: [rawTorrent()] };
    if (req.url === '/precompiled/data_top100_200.json') return { json: [rawTorrent({ id: '7' })] };
    if (req.url === '/precompiled/data_top100_all.json') return { json: NO_RESULTS };
  });
  t.after(server.close);

  const results = await search('blade runner', { category: 'video', api: server.url });
  assert.equal(results.length, 1);
  assert.equal(server.requests[0].url, '/q.php?q=blade%20runner&cat=200');

  const top = await search('  ', { category: 'video', api: `${server.url}/` });
  assert.equal(top[0].id, '7');
  assert.deepEqual(await search('', { api: server.url }), []);
});

test('search reports HTTP errors and non-JSON responses clearly', async (t) => {
  const server = await startServer((req) =>
    req.url.includes('broken') ? { text: '<html>challenge</html>' } : { status: 503, text: 'down' }
  );
  t.after(server.close);
  await assert.rejects(search('x', { api: server.url }), /HTTP 503/);
  await assert.rejects(search('x', { api: `${server.url}/broken` }), /isn't JSON/);
});
