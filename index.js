// The Pirate Bay client. thepiratebay.org is a static front end that loads
// its data from the JSON API at apibay.org, so we talk to the API directly.
import { getJSON } from './lib/http.js';

export const API_URL = 'https://apibay.org';
export const SITE_URL = 'https://thepiratebay.org';
export const ONION_URL = 'http://piratebayo3klnzokct3wt5yyxb2vpebbuyjl7m623iaxmqhsd52coid.onion';

// The trackers thepiratebay.org appends to its own magnet links.
export const TRACKERS = [
  'udp://tracker.opentrackr.org:1337',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.bittor.pw:1337/announce',
  'udp://public.popcorn-tracker.org:6969/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://exodus.desync.com:6969',
  'udp://open.demonii.com:1337/announce',
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://torrent.gresille.org:80/announce',
  'udp://p4p.arenabg.com:1337',
  'udp://tracker.internetwarriors.net:1337'
];

export const CATEGORIES = {
  all: 0,
  audio: 100,
  video: 200,
  apps: 300,
  games: 400,
  other: 600
};

// Older magsearch versions used this keyword name.
const CATEGORY_ALIASES = { applications: 'apps' };

const MAIN_CATEGORIES = { 1: 'Audio', 2: 'Video', 3: 'Apps', 4: 'Games', 6: 'Other' };

// The Pirate Bay's adult section (500–599) is left out of every result.
export function isAdultCategory(code) {
  return Math.floor(Number(code) / 100) === 5;
}

const SUBCATEGORIES = {
  101: 'Music', 102: 'Audio Books', 103: 'Sound clips', 104: 'FLAC', 199: 'Other',
  201: 'Movies', 202: 'Movies DVDR', 203: 'Music videos', 204: 'Movie Clips', 205: 'TV-Shows',
  206: 'Handheld', 207: 'HD Movies', 208: 'HD TV-Shows', 209: '3D', 210: 'CAM/TS',
  211: 'UHD/4k Movies', 212: 'UHD/4k TV-Shows', 299: 'Other',
  301: 'Windows', 302: 'Mac/Apple', 303: 'UNIX', 304: 'Handheld', 305: 'iOS', 306: 'Android', 399: 'Other OS',
  401: 'PC', 402: 'Mac/Apple', 403: 'PSx', 404: 'XBOX360', 405: 'Wii', 406: 'Handheld', 407: 'iOS',
  408: 'Android', 499: 'Other OS',
  601: 'E-books', 602: 'Comics', 603: 'Pictures', 604: 'Covers', 605: 'Physibles', 699: 'Other'
};

export function resolveCategory(name) {
  if (name === undefined || name === null || name === '') return 'all';
  const key = String(name).toLowerCase();
  const resolved = CATEGORY_ALIASES[key] ?? key;
  if (!Object.hasOwn(CATEGORIES, resolved)) {
    throw new Error(
      `Unknown category "${name}". Use one of: ${Object.keys(CATEGORIES).join(', ')}.`
    );
  }
  return resolved;
}

// "Video > HD Movies" style label for a numeric category code.
export function categoryLabel(code, { short = false } = {}) {
  const num = Number(code);
  const main = MAIN_CATEGORIES[Math.floor(num / 100)];
  if (!main) return '';
  const sub = SUBCATEGORIES[num];
  if (!sub) return main;
  if (short) return sub === 'Other' || sub === 'Other OS' ? `${main} ${sub}` : sub;
  return `${main} > ${sub}`;
}

export function magnetLink(infoHash, name, trackers = TRACKERS) {
  let link = `magnet:?xt=urn:btih:${infoHash}`;
  if (name) link += `&dn=${encodeURIComponent(name)}`;
  for (const tracker of trackers) link += `&tr=${encodeURIComponent(tracker)}`;
  return link;
}

const EMPTY_HASH = /^0+$/;
const VALID_HASH = /^[0-9a-f]{40}$/i;

function toTorrent(raw) {
  const infoHash = String(raw.info_hash ?? '').toUpperCase();
  const name = String(raw.name ?? '');
  return {
    id: String(raw.id),
    name,
    infoHash,
    size: Number(raw.size) || 0,
    seeders: Number(raw.seeders) || 0,
    leechers: Number(raw.leechers) || 0,
    files: Number(raw.num_files) || 0,
    uploader: String(raw.username ?? ''),
    status: String(raw.status ?? 'member'),
    added: Number(raw.added) || 0,
    category: Number(raw.category) || 0,
    imdb: String(raw.imdb ?? ''),
    magnet: magnetLink(infoHash, name)
  };
}

export function parseResults(data) {
  if (!Array.isArray(data)) {
    throw new Error('The Pirate Bay API sent an unexpected response.');
  }
  return data
    .filter(
      (raw) =>
        raw &&
        VALID_HASH.test(raw.info_hash) &&
        !EMPTY_HASH.test(raw.info_hash) &&
        raw.id !== '0' &&
        !isAdultCategory(raw.category)
    )
    .map(toTorrent);
}

function apiBase(api) {
  return String(api || API_URL).replace(/\/+$/, '');
}

/**
 * Search The Pirate Bay. An empty query returns the top 100 for the category.
 *
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.category] all, audio, video, apps, games, porn or other
 * @param {string} [options.api] API base URL (default https://apibay.org)
 * @param {{host: string, port: number}} [options.proxy] SOCKS5 proxy, e.g. Tor
 * @param {number} [options.timeout] request timeout in ms
 */
export async function search(query, { category = 'all', api, proxy, timeout } = {}) {
  const cat = CATEGORIES[resolveCategory(category)];
  const q = String(query ?? '').trim();
  const url = q
    ? `${apiBase(api)}/q.php?q=${encodeURIComponent(q)}&cat=${cat}`
    : `${apiBase(api)}/precompiled/data_top100_${cat || 'all'}.json`;
  return parseResults(await getJSON(url, { proxy, timeout }));
}

export function top(category = 'all', options = {}) {
  return search('', { ...options, category });
}

// Links to the same results / torrent on the website.
export function searchUrl(query, category = 'all', { onion = false } = {}) {
  const base = onion ? ONION_URL : SITE_URL;
  const cat = CATEGORIES[resolveCategory(category)];
  const q = String(query ?? '').trim();
  if (!q) return `${base}/search.php?q=top100:${cat || 'all'}`;
  return `${base}/search.php?q=${encodeURIComponent(q)}${cat ? `&cat=${cat}` : ''}`;
}

export function torrentUrl(id, { onion = false } = {}) {
  return `${onion ? ONION_URL : SITE_URL}/description.php?id=${encodeURIComponent(id)}`;
}
