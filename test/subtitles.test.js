import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fetchSubtitles, parseRelease, pickBest, searchCandidates } from '../lib/subtitles.js';
import { startServer, tempDir } from './helpers.js';

test('parseRelease pulls the title, year and episode out of release names', () => {
  assert.deepEqual(parseRelease('Blade.Runner.2049.2017.1080p.BluRay.H264.AAC'), {
    title: 'Blade Runner 2049',
    year: 2017,
    season: undefined,
    episode: undefined
  });
  assert.equal(parseRelease('Blade Runner (1982) Final Cut 1080p BluRay').title, 'Blade Runner');
  assert.equal(parseRelease('1917 (2019) [1080p] [BluRay]').title, '1917');
  const episode = parseRelease('The.Last.of.Us.S02E03.1080p.WEB.h264-ETHEL');
  assert.equal(episode.title, 'The Last of Us');
  assert.equal(episode.season, 2);
  assert.equal(episode.episode, 3);
  assert.equal(parseRelease('Some Documentary').title, 'Some Documentary');
});

test('searchCandidates prefers IMDb ids, then falls back to the title', () => {
  const movie = searchCandidates({ name: 'Blade.Runner.2049.2017.1080p', imdb: 'tt1856101' }, 'en');
  assert.deepEqual(movie, [
    { languages: 'en', imdb_id: 1856101 },
    { languages: 'en', query: 'Blade Runner 2049', year: 2017 }
  ]);
  const show = searchCandidates({ name: 'Severance.S02E01.720p', imdb: 'tt11280740' }, 'es');
  assert.deepEqual(show[0], { languages: 'es', parent_imdb_id: 11280740, season_number: 2, episode_number: 1 });
  assert.equal(searchCandidates({ name: 'Unknown.Thing.720p', imdb: '' }, 'en').length, 1);
});

test('pickBest prefers human translations of the same release', () => {
  const sub = (release, downloads, extra = {}) => ({
    attributes: { release, download_count: downloads, files: [{ file_id: downloads }], ...extra }
  });
  const best = pickBest(
    [
      sub('Blade.Runner.2049.2017.720p.WEB', 9000),
      sub('Blade.Runner.2049.2017.1080p.BluRay.H264.AAC', 10, { machine_translated: true }),
      sub('Blade.Runner.2049.2017.1080p.BluRay.x264', 500),
      { attributes: { release: 'no files', files: [] } }
    ],
    'Blade.Runner.2049.2017.1080p.BluRay.H264.AAC'
  );
  assert.equal(best.attributes.download_count, 500);
  assert.equal(pickBest([], 'x'), undefined);
});

function openSubtitlesMock({ results = 1, downloadStatus = 200 } = {}) {
  let server;
  const ready = startServer((req, body) => {
    const url = new URL(req.url, server.url);
    if (url.pathname === '/api/v1/login') {
      return { json: { token: `token-for-${JSON.parse(body).username}` } };
    }
    if (url.pathname === '/api/v1/subtitles') {
      const hasImdb = url.searchParams.has('imdb_id');
      return {
        json: {
          data: hasImdb && results === 0 ? [] : [
            { attributes: { release: 'Blade.Runner.2049.2017.1080p.BluRay', download_count: 3, files: [{ file_id: 555 }] } }
          ]
        }
      };
    }
    if (url.pathname === '/api/v1/download') {
      if (downloadStatus !== 200) return { status: downloadStatus, json: { message: 'You have downloaded your allowed 5 subtitles for 24h' } };
      return { json: { link: `${server.url}/files/555.srt`, remaining: 4 } };
    }
    if (url.pathname === '/files/555.srt') return { text: '1\n00:00:01,000 --> 00:00:02,000\nHello\n' };
  });
  return ready.then((s) => (server = s));
}

const torrent = { name: 'Blade.Runner.2049.2017.1080p.BluRay.H264.AAC', imdb: 'tt1856101' };

test('fetchSubtitles searches, downloads and saves an .srt', async (t) => {
  const server = await openSubtitlesMock();
  t.after(server.close);
  const dir = tempDir();

  const found = await fetchSubtitles(torrent, {
    apiKey: 'KEY123',
    language: 'en',
    api: `${server.url}/api/v1`,
    dir
  });

  assert.equal(found.release, 'Blade.Runner.2049.2017.1080p.BluRay');
  assert.match(fs.readFileSync(found.path, 'utf8'), /Hello/);

  const [searchReq, downloadReq] = server.requests;
  assert.equal(searchReq.url, '/api/v1/subtitles?imdb_id=1856101&languages=en');
  assert.equal(searchReq.headers['api-key'], 'KEY123');
  assert.match(searchReq.headers['user-agent'], /^magsearch v\d+\.\d+\.\d+$/);
  assert.equal(searchReq.headers.authorization, undefined);
  assert.deepEqual(JSON.parse(downloadReq.body), { file_id: 555, sub_format: 'srt' });
});

test('fetchSubtitles logs in when credentials are set and falls back to a title search', async (t) => {
  const server = await openSubtitlesMock({ results: 0 });
  t.after(server.close);

  await fetchSubtitles(torrent, {
    apiKey: 'KEY123',
    username: 'Me',
    password: 'secret',
    language: 'pt-BR',
    api: `${server.url}/api/v1`,
    dir: tempDir()
  });

  const urls = server.requests.map((r) => `${r.method} ${r.url}`);
  assert.deepEqual(urls.slice(0, 3), [
    'POST /api/v1/login',
    'GET /api/v1/subtitles?imdb_id=1856101&languages=pt-br',
    'GET /api/v1/subtitles?languages=pt-br&query=blade+runner+2049&year=2017'
  ]);
  assert.equal(server.requests[1].headers.authorization, 'Bearer token-for-Me');
});

test('fetchSubtitles explains failures', async (t) => {
  const server = await openSubtitlesMock({ downloadStatus: 406 });
  t.after(server.close);
  await assert.rejects(
    fetchSubtitles(torrent, { apiKey: 'KEY', language: 'en', api: `${server.url}/api/v1`, dir: tempDir() }),
    /allowed 5 subtitles/
  );
  await assert.rejects(fetchSubtitles(torrent, { language: 'en' }), /API key/);
});
