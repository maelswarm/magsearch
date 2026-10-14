import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BUNDLED_BLOCKLIST, blocklistPath, findPeerflix, peerflixArgs, runPeerflix } from '../lib/launch.js';
import { DEFAULTS } from '../lib/settings.js';
import { tempDir } from './helpers.js';

const MAGNET = 'magnet:?xt=urn:btih:ABC&dn=Blade%20Runner%20%26%20Co&tr=udp%3A%2F%2Ft%3A1';

test('peerflix arguments follow the settings', () => {
  assert.deepEqual(peerflixArgs(MAGNET, { ...DEFAULTS, blocklist: '' }), [MAGNET, '--vlc', '--remove']);
  assert.deepEqual(
    peerflixArgs(MAGNET, { ...DEFAULTS, player: 'none', path: '/movies', blocklist: '/lists/bt' }, { subtitles: '/tmp/a.srt' }),
    [MAGNET, '--path=/movies', '--blocklist=/lists/bt', '--subtitles=/tmp/a.srt']
  );
});

test('the "auto" blocklist is the one shipped with magsearch', () => {
  assert.equal(path.basename(BUNDLED_BLOCKLIST), 'btlev1');
  assert.equal(blocklistPath('auto'), fs.existsSync(BUNDLED_BLOCKLIST) ? BUNDLED_BLOCKLIST : null);
  assert.equal(blocklistPath(''), null);
  assert.equal(blocklistPath('off'), null);
  assert.equal(blocklistPath('/my/list'), '/my/list');
});

test('runPeerflix passes magnet links through untouched', async (t) => {
  const dir = tempDir();
  const out = path.join(dir, 'args.json');
  const script = path.join(dir, 'fake-peerflix.cjs');
  fs.writeFileSync(
    script,
    `require('fs').writeFileSync(${JSON.stringify(out)}, JSON.stringify(process.argv.slice(2)))`
  );
  process.env.MAGSEARCH_PEERFLIX = script;
  t.after(() => delete process.env.MAGSEARCH_PEERFLIX);

  assert.deepEqual(findPeerflix(), { command: process.execPath, args: [script] });
  const args = [MAGNET, '--vlc', '--subtitles=C:\\Temp Dir\\100% sub.srt'];
  const { code } = await runPeerflix(args);
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), args);
});
