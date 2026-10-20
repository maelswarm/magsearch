// How requests leave this computer: directly, through Tor, or through a SOCKS
// proxy. Under the hood both are reached over SOCKS5 (Tor exposes a local
// SOCKS port), but they're separate options with separate settings.
import { search } from '../index.js';
import { searchOnion } from './onion.js';

export const TOR_HOST = '127.0.0.1';

export function proxyFor({ connection, torPort, socksHost, socksPort }) {
  if (connection === 'tor') return { host: TOR_HOST, port: Number(torPort), tor: true };
  if (connection === 'socks') return { host: socksHost, port: Number(socksPort), tor: false };
  return undefined;
}

// Search using the user's settings: the .onion site when it's turned on
// (which needs Tor), otherwise the apibay.org API.
export function findTorrents(query, { category, config }) {
  const proxy = proxyFor(config);
  if (config.onion) {
    if (config.connection !== 'tor') {
      return Promise.reject(new Error('The .onion site needs Tor. Turn on Tor in settings or run with --tor.'));
    }
    return searchOnion(query, { category, proxy });
  }
  return search(query, { category, api: config.api, proxy });
}
