// The Pirate Bay's .onion site, searched through Tor the way older magsearch
// versions did: by reading its classic HTML results table.
import { CATEGORIES, ONION_URL, isAdultCategory, resolveCategory } from '../index.js';
import { request } from './http.js';

const UNITS = { B: 0, KiB: 1, MiB: 2, GiB: 3, TiB: 4, PiB: 5 };
const STATUS_BADGES = { VIP: 'vip', Trusted: 'trusted', Helper: 'helper', Moderator: 'moderator', 'Super Mod': 'supermod', Admin: 'admin' };

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseSize(text) {
  const match = /Size\s+([\d.]+)\s*(B|KiB|MiB|GiB|TiB|PiB)/.exec(text);
  return match ? Math.round(Number(match[1]) * 1024 ** UNITS[match[2]]) : 0;
}

// "Uploaded 04-25 16:35" (this year), "04-01 2019", "Today 12:34", "Y-day 12:34", "5 mins ago".
function parseUploaded(text, now) {
  const match = /Uploaded\s+(.+?),\s*Size/.exec(text);
  if (!match) return 0;
  const when = match[1].replace(/<[^>]+>/g, '').trim();
  const today = new Date(now);
  let m;
  if ((m = /^(\d+)\s*mins?\s*ago/.exec(when))) return Math.floor(now / 1000) - Number(m[1]) * 60;
  if ((m = /^(Today|Y-day)\s+(\d\d):(\d\d)/.exec(when))) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (m[1] === 'Y-day' ? 1 : 0), Number(m[2]), Number(m[3]));
    return Math.floor(day.getTime() / 1000);
  }
  if ((m = /^(\d\d)-(\d\d)\s+(\d\d):(\d\d)/.exec(when))) {
    return Math.floor(new Date(today.getFullYear(), Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4])).getTime() / 1000);
  }
  if ((m = /^(\d\d)-(\d\d)\s+(\d{4})/.exec(when))) {
    return Math.floor(new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).getTime() / 1000);
  }
  return 0;
}

/**
 * Parse a classic Pirate Bay results page (search or top 100). Returns null
 * when the page isn't in that layout, so the caller can try something else.
 */
export function parseClassicPage(html, { base = ONION_URL, now = Date.now() } = {}) {
  const start = html.indexOf('id="searchResult"');
  if (start === -1) return /No hits\./.test(html) ? [] : null;
  const end = html.indexOf('</table>', start);
  const table = html.slice(start, end === -1 ? undefined : end);

  const results = [];
  for (const row of table.split(/<tr[\s>]/).slice(1)) {
    if (!row.includes('class="detName"')) continue;
    const magnet = /href="(magnet:\?[^"]+)"/.exec(row);
    const hash = magnet && /btih:([0-9a-f]{40})/i.exec(magnet[1]);
    const name = /class="detLink"[^>]*>([^<]*)</.exec(row);
    if (!hash || !name) continue;

    const categories = [...row.matchAll(/\/browse\/(\d{3})/g)].map((m) => Number(m[1]));
    const category = categories.at(-1) ?? 0;
    if (isAdultCategory(category)) continue;

    const counts = [...row.matchAll(/<td align="right">(\d+)<\/td>/g)].map((m) => Number(m[1]));
    const id = /\/torrent\/(\d+)/.exec(row)?.[1] ?? '';
    const badge = /<img [^>]*alt="(VIP|Trusted|Helper|Moderator|Super Mod|Admin)"/.exec(row);
    const desc = decodeEntities(/class="detDesc">([\s\S]*?)<\/font>/.exec(row)?.[1] ?? '');
    const uploader = /ULed by\s*(?:<a[^>]*>)?\s*(?:<i>)?([^<]+)/.exec(desc)?.[1].trim() ?? '';

    results.push({
      id,
      name: decodeEntities(name[1]).trim(),
      infoHash: hash[1].toUpperCase(),
      size: parseSize(desc),
      seeders: counts.at(-2) ?? 0,
      leechers: counts.at(-1) ?? 0,
      files: 0,
      uploader,
      status: badge ? STATUS_BADGES[badge[1]] : 'member',
      added: parseUploaded(desc, now),
      category,
      imdb: '',
      magnet: decodeEntities(magnet[1]),
      url: id ? `${base}/torrent/${id}` : ''
    });
  }
  return results;
}

// Search the .onion site. Throws if it can't be reached or isn't in the
// classic layout.
export async function searchOnion(query, { category = 'all', proxy, timeout = 45000, base = ONION_URL } = {}) {
  const cat = CATEGORIES[resolveCategory(category)];
  const q = String(query ?? '').trim();
  const url = q ? `${base}/search/${encodeURIComponent(q)}/0/99/${cat}` : `${base}/top/${cat || 'all'}`;
  const res = await request(url, { proxy, timeout });
  if (res.status !== 200) throw new Error(`The .onion site answered with HTTP ${res.status}.`);
  const results = parseClassicPage(res.body, { base });
  if (!results) throw new Error("The .onion site's page layout wasn't recognized.");
  return results;
}
