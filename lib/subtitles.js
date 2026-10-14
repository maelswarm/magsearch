// Subtitles from the OpenSubtitles.com REST API. Needs a (free) API key from
// https://www.opensubtitles.com/consumers. Logging in with a username and
// password is optional and raises the daily download limit.
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { request } from './http.js';
import { VERSION } from './version.js';

export const OPENSUBTITLES_API = 'https://api.opensubtitles.com/api/v1';

export const SUBTITLE_LANGUAGES = [
  'none', 'en', 'es', 'fr', 'de', 'it', 'pt-pt', 'pt-br', 'nl', 'pl',
  'sv', 'da', 'no', 'fi', 'ru', 'tr', 'el', 'ar', 'he', 'hi', 'ja', 'ko', 'zh-cn', 'zh-tw'
];

const EPISODE = /\bs(\d{1,2})[ ._-]?e(\d{1,3})\b/i;
const YEAR = /\b(19\d{2}|20\d{2})\b/g;
const RELEASE_TAG =
  /\b(2160p|1080p|720p|576p|480p|4k|uhd|hdr|bluray|blu-ray|bdrip|brrip|webrip|web-dl|web|hdtv|dvdrip|dvdr|dvdscr|hdcam|cam|ts|xvid|x264|x265|h264|h265|hevc|remux|proper|repack|extended|unrated|imax|complete)\b/i;

// "Blade.Runner.2049.2017.1080p.BluRay" → { title: 'Blade Runner 2049', year: 2017 }
export function parseRelease(name) {
  const text = String(name).replace(/[._]+/g, ' ');
  const cuts = [];
  const episode = EPISODE.exec(text);
  if (episode) cuts.push(episode.index);
  const tag = RELEASE_TAG.exec(text);
  if (tag) cuts.push(tag.index);
  const bracket = text.search(/[[({]/);
  if (bracket > 0) cuts.push(bracket);
  const tagsStart = cuts.length ? Math.min(...cuts) : text.length;

  // The release year is the last year-like number before the tags (it may sit
  // just inside a bracket). Earlier ones belong to the title, as in
  // "Blade Runner 2049 2017" or "1917 (2019)".
  let yearMatch;
  for (const match of text.matchAll(YEAR)) {
    if (match.index > 0 && match.index <= tagsStart + 1) yearMatch = match;
  }
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const end = yearMatch ? Math.min(tagsStart, yearMatch.index) : tagsStart;
  const title = text
    .slice(0, end)
    .replace(/[[\](){}\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || text.trim(),
    year,
    season: episode ? Number(episode[1]) : undefined,
    episode: episode ? Number(episode[2]) : undefined
  };
}

function imdbNumber(imdb) {
  const n = parseInt(String(imdb ?? '').replace(/^tt/i, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Search parameters for a torrent, most precise first. TPB's IMDb id for a
// TV episode is usually the show's id, hence parent_imdb_id.
export function searchCandidates(torrent, language) {
  const release = parseRelease(torrent.name);
  const imdb = imdbNumber(torrent.imdb);
  const episode =
    release.season !== undefined
      ? { season_number: release.season, episode_number: release.episode }
      : {};
  const byTitle = { languages: language, query: release.title, ...episode };
  if (release.year && release.season === undefined) byTitle.year = release.year;

  const candidates = [];
  if (imdb) {
    candidates.push(
      release.season !== undefined
        ? { languages: language, parent_imdb_id: imdb, ...episode }
        : { languages: language, imdb_id: imdb }
    );
  }
  candidates.push(byTitle);
  return candidates;
}

function tokens(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

// Prefer subtitles made for the same release (matching source/group tags),
// then human translations, then popularity.
export function pickBest(results, torrentName) {
  const wanted = new Set(tokens(torrentName));
  const scored = results
    .filter((r) => r?.attributes?.files?.length)
    .map((r) => {
      const a = r.attributes;
      return {
        result: r,
        overlap: tokens(a.release).filter((t) => wanted.has(t)).length,
        human: a.machine_translated || a.ai_translated ? 0 : 1,
        downloads: Number(a.download_count) || 0
      };
    });
  scored.sort(
    (x, y) => y.human - x.human || y.overlap - x.overlap || y.downloads - x.downloads
  );
  return scored[0]?.result;
}

function explain(status, data) {
  const detail = data?.message || data?.errors?.join(' ');
  switch (status) {
    case 401:
      return 'OpenSubtitles rejected the login or API key.';
    case 403:
      return 'OpenSubtitles rejected the API key. Check it in settings.';
    case 406:
    case 407:
      return detail || 'OpenSubtitles download limit reached for today.';
    case 429:
      return 'OpenSubtitles is rate limiting requests. Try again in a moment.';
    case 503:
      return 'OpenSubtitles is temporarily unavailable.';
    default:
      return detail ? `OpenSubtitles: ${detail}` : `OpenSubtitles answered with HTTP ${status}.`;
  }
}

class OpenSubtitles {
  constructor({ apiKey, proxy, api = OPENSUBTITLES_API }) {
    this.apiKey = apiKey;
    this.proxy = proxy;
    this.base = api.replace(/\/+$/, '');
    this.token = null;
  }

  async call(endpoint, { method = 'GET', params, body } = {}) {
    let url = `${this.base}/${endpoint}`;
    if (params) {
      // The API redirects unless parameters are sorted and lowercase.
      const entries = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()])
        .sort(([a], [b]) => a.localeCompare(b));
      url += `?${new URLSearchParams(entries)}`;
    }
    const headers = {
      'Api-Key': this.apiKey,
      'User-Agent': `magsearch v${VERSION}`,
      Accept: 'application/json'
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    let payload;
    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }
    const res = await request(url, { method, headers, body: payload, proxy: this.proxy });
    let data = {};
    try {
      data = JSON.parse(res.body);
    } catch {
      // Error pages aren't always JSON; the status code says enough.
    }
    if (res.status !== 200) throw new Error(explain(res.status, data));
    return data;
  }

  async login(username, password) {
    const data = await this.call('login', { method: 'POST', body: { username, password } });
    this.token = data.token;
    if (data.base_url) this.base = `https://${data.base_url}/api/v1`;
  }
}

/**
 * Find and download the best subtitle for a torrent. Resolves to
 * { path, release, language } or null when nothing matches.
 */
export async function fetchSubtitles(
  torrent,
  { apiKey, username, password, language, proxy, api, dir = tmpdir() }
) {
  if (!apiKey) throw new Error('Add your OpenSubtitles API key in settings first.');
  const client = new OpenSubtitles({ apiKey, proxy, api });
  if (username && password) await client.login(username, password);

  let best;
  for (const params of searchCandidates(torrent, language)) {
    const found = await client.call('subtitles', { params });
    best = pickBest(found.data ?? [], torrent.name);
    if (best) break;
  }
  if (!best) return null;

  const fileId = best.attributes.files[0].file_id;
  const download = await client.call('download', {
    method: 'POST',
    body: { file_id: fileId, sub_format: 'srt' }
  });
  if (!download.link) throw new Error(explain(406, download));

  const file = await request(download.link, { proxy });
  if (file.status !== 200 || !file.body) {
    throw new Error(`Couldn't download the subtitle file (HTTP ${file.status}).`);
  }
  const target = path.join(dir, `magsearch-${fileId}.srt`);
  await writeFile(target, file.body, 'utf8');
  return { path: target, release: best.attributes.release || '', language };
}
