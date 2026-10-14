import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseClassicPage, searchOnion } from '../lib/onion.js';
import { startServer } from './helpers.js';

const fixture = fs.readFileSync(new URL('./fixtures/classic-search.html', import.meta.url), 'utf8');
const now = new Date(2026, 9, 14, 17, 0).getTime();

test('parses the classic results table and leaves out the adult section', () => {
  const results = parseClassicPage(fixture, { base: 'http://example.onion', now });
  assert.deepEqual(
    results.map((r) => [r.name, r.status, r.category]),
    [
      ['Ubuntu 22.04 LTS', 'vip', 303],
      ['ubuntu-24.04.1-desktop-amd64.iso', 'trusted', 303],
      ['ubuntu-26.04-desktop-amd64.iso', 'member', 303]
    ]
  );
  const [first, second, third] = results;
  assert.match(first.infoHash, /^[0-9A-F]{40}$/);
  assert.ok(first.magnet.startsWith(`magnet:?xt=urn:btih:${first.infoHash}&dn=`), first.magnet.slice(0, 80));
  assert.ok(!first.magnet.includes('&amp;'));
  assert.ok(first.size > 3e9 && first.seeders >= 0 && first.leechers >= 0);
  assert.equal(first.url, `http://example.onion/torrent/${first.id}`);
  assert.equal(new Date(first.added * 1000).getFullYear(), 2022);
  assert.equal(new Date(second.added * 1000).getDate(), 13); // Y-day
  assert.equal(Math.floor(now / 1000) - third.added, 300); // 5 mins ago
  assert.ok(first.uploader.length > 0);
});

test('recognizes "no hits" pages and unknown layouts', () => {
  assert.deepEqual(parseClassicPage('<p>No hits. Try adding an asterisk in you search phrase.</p>'), []);
  assert.equal(parseClassicPage('<html><script src="/static/main.js"></script></html>'), null);
});

test('searchOnion builds the old search and top 100 URLs', async (t) => {
  const server = await startServer((req) =>
    req.url.includes('broken') ? { text: '<html>new layout</html>' } : { text: fixture }
  );
  t.after(server.close);

  const results = await searchOnion('blade runner', { category: 'video', base: server.url });
  assert.equal(results.length, 3);
  await searchOnion('', { base: server.url });
  await searchOnion('', { category: 'audio', base: server.url });
  assert.deepEqual(
    server.requests.map((r) => r.url),
    ['/search/blade%20runner/0/99/200', '/top/all', '/top/100']
  );
  await assert.rejects(searchOnion('x', { base: `${server.url}/broken` }), /layout wasn't recognized/);
});
