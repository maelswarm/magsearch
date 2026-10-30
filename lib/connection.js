// How requests leave this computer: directly, through Tor, or through a SOCKS
// proxy. Under the hood both are reached over SOCKS5 (Tor exposes a local
// SOCKS port), but they're separate options with separate settings.
//
// And where searches go: the apibay.org API by default, a Pirate Bay site the
// user picked, or the .onion site.
import { ONION_URL, search } from '../index.js';
import { searchSite } from './classic.js';

export const TOR_HOST = '127.0.0.1';

export function proxyFor({ connection, torPort, socksHost, socksPort }) {
  if (connection === 'tor') return { host: TOR_HOST, port: Number(torPort), tor: true };
  if (connection === 'socks') return { host: socksHost, port: Number(socksPort), tor: false };
  return undefined;
}

// "thepiratebay0.org" → "https://thepiratebay0.org". Throws if it isn't a URL.
export function siteUrl(site) {
  const text = String(site ?? '').trim();
  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error(`"${text}" isn't a valid site URL.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`"${text}" isn't an http or https URL.`);
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

// The base URL of the site to search, or null for the apibay.org API.
export function siteFor({ onion, site }) {
  if (onion && site) throw new Error('Use either the .onion site or a Pirate Bay site, not both.');
  if (onion) return ONION_URL;
  return site ? siteUrl(site) : null;
}

// Search using the user's settings. `api` overrides the API URL (for tests).
export async function findTorrents(query, { category, config, api }) {
  const proxy = proxyFor(config);
  const base = siteFor(config);
  if (base === ONION_URL) {
    if (config.connection !== 'tor') {
      throw new Error('The .onion site needs Tor. Turn on Tor in settings or run with --tor.');
    }
    return searchSite(query, { base, category, proxy, timeout: 45000 });
  }
  if (base) return searchSite(query, { base, category, proxy });
  return search(query, { category, api, proxy });
}
