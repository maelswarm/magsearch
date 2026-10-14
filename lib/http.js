import http from 'node:http';
import https from 'node:https';
import { VERSION } from './version.js';

export const USER_AGENT = `magsearch/${VERSION}`;

const proxyAgents = new Map();

// `proxy` is { host, port } for a SOCKS5 proxy such as Tor. socks5h makes the
// proxy resolve hostnames, so DNS lookups don't leak around it.
async function agentFor(proxy) {
  if (!proxy) return undefined;
  const host = proxy.host.includes(':') ? `[${proxy.host}]` : proxy.host;
  const key = `socks5h://${host}:${proxy.port}`;
  if (!proxyAgents.has(key)) {
    const { SocksProxyAgent } = await import('socks-proxy-agent');
    proxyAgents.set(key, new SocksProxyAgent(key));
  }
  return proxyAgents.get(key);
}

function describeError(err, url, proxy) {
  if (proxy && /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/.test(err.code || err.message)) {
    return new Error(
      `Can't reach the SOCKS proxy at ${proxy.host}:${proxy.port}. Is Tor running?`,
      { cause: err }
    );
  }
  if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
    return new Error(`Can't resolve ${url.hostname}. Are you online?`, { cause: err });
  }
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
    return new Error(`${url.hostname} refused the connection (${err.code}).`, { cause: err });
  }
  return err;
}

export async function request(
  url,
  { method = 'GET', headers = {}, body, proxy, timeout = 20000, redirects = 3 } = {}
) {
  const target = new URL(url);
  const agent = await agentFor(proxy);
  const transport = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      target,
      { method, headers: { 'user-agent': USER_AGENT, ...headers }, agent, timeout },
      (res) => {
        const { statusCode, headers: resHeaders } = res;
        if (statusCode >= 300 && statusCode < 400 && resHeaders.location && redirects > 0) {
          res.resume();
          const next = new URL(resHeaders.location, target).toString();
          const keepMethod = statusCode === 307 || statusCode === 308;
          resolve(
            request(next, {
              method: keepMethod ? method : 'GET',
              headers,
              body: keepMethod ? body : undefined,
              proxy,
              timeout,
              redirects: redirects - 1
            })
          );
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            status: statusCode,
            headers: resHeaders,
            body: Buffer.concat(chunks).toString('utf8')
          })
        );
      }
    );
    req.on('timeout', () =>
      req.destroy(new Error(`${target.hostname} took too long to respond.`))
    );
    req.on('error', (err) => reject(describeError(err, target, proxy)));
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export async function getJSON(url, options) {
  const res = await request(url, options);
  const { hostname } = new URL(url);
  if (res.status !== 200) {
    const err = new Error(`${hostname} answered with HTTP ${res.status}.`);
    err.status = res.status;
    throw err;
  }
  try {
    return JSON.parse(res.body);
  } catch {
    throw new Error(`${hostname} sent back something that isn't JSON. It may be down or blocked.`);
  }
}
