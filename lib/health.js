// Live seeder/leecher counts via UDP tracker scrapes (BEP 15). One scrape
// request covers up to MAX_HASHES torrents, so a page of results costs only a
// couple of packets per tracker.
import dgram from 'node:dgram';
import { randomBytes } from 'node:crypto';

const PROTOCOL_ID = 0x41727101980n;
const ACTION_CONNECT = 0;
const ACTION_SCRAPE = 2;
const ACTION_ERROR = 3;
const MAX_HASHES = 70;

/**
 * Scrape one UDP tracker. Resolves to a Map of lowercase info hash →
 * { seeders, completed, leechers }.
 */
export function scrapeTracker(trackerUrl, infoHashes, { timeout = 4000 } = {}) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(trackerUrl);
    } catch {
      reject(new Error(`Invalid tracker URL: ${trackerUrl}`));
      return;
    }
    if (url.protocol !== 'udp:' || !url.port) {
      reject(new Error(`Not a UDP tracker: ${trackerUrl}`));
      return;
    }

    const host = url.hostname.replace(/^\[|\]$/g, '');
    const port = Number(url.port);
    const hashes = infoHashes.map((h) => h.toLowerCase());
    const socket = dgram.createSocket(host.includes(':') ? 'udp6' : 'udp4');
    let transactionId = 0;
    let connected = false;
    let lastPacket = null;
    let finished = false;

    const finish = (err, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(retry);
      socket.close();
      if (err) reject(err);
      else resolve(value);
    };

    const send = (packet) => {
      lastPacket = packet;
      socket.send(packet, port, host, (err) => err && finish(err));
    };

    const header = (connectionId, action) => {
      transactionId = randomBytes(4).readUInt32BE(0);
      const buf = Buffer.alloc(16);
      buf.writeBigUInt64BE(connectionId, 0);
      buf.writeUInt32BE(action, 8);
      buf.writeUInt32BE(transactionId, 12);
      return buf;
    };

    socket.on('error', finish);
    socket.on('message', (msg) => {
      if (msg.length < 8 || msg.readUInt32BE(4) !== transactionId) return;
      const action = msg.readUInt32BE(0);
      if (action === ACTION_ERROR) {
        finish(new Error(`${host}: ${msg.subarray(8).toString()}`));
      } else if (action === ACTION_CONNECT && !connected && msg.length >= 16) {
        connected = true;
        const connectionId = msg.readBigUInt64BE(8);
        send(Buffer.concat([header(connectionId, ACTION_SCRAPE), ...hashes.map((h) => Buffer.from(h, 'hex'))]));
      } else if (action === ACTION_SCRAPE && connected) {
        const stats = new Map();
        hashes.forEach((hash, i) => {
          const offset = 8 + i * 12;
          if (msg.length >= offset + 12) {
            stats.set(hash, {
              seeders: msg.readUInt32BE(offset),
              completed: msg.readUInt32BE(offset + 4),
              leechers: msg.readUInt32BE(offset + 8)
            });
          }
        });
        finish(null, stats);
      }
    });

    // UDP is lossy: resend the last packet once halfway through the timeout.
    const retry = setTimeout(() => lastPacket && !finished && send(lastPacket), timeout / 2);
    const timer = setTimeout(() => finish(new Error(`${host} did not answer`)), timeout);
    send(header(PROTOCOL_ID, ACTION_CONNECT));
  });
}

/**
 * Scrape several trackers and keep the highest counts reported for each
 * torrent. Resolves to { stats: Map<hash, {seeders, leechers}>, responded }.
 * `onProgress(stats)` is called each time another tracker answers.
 */
export async function scrape(infoHashes, trackers, { timeout = 4000, onProgress } = {}) {
  const hashes = [...new Set(infoHashes.map((h) => h.toLowerCase()))].filter((h) =>
    /^[0-9a-f]{40}$/.test(h)
  );
  const udpTrackers = trackers.filter((t) => t.startsWith('udp://'));
  const chunks = [];
  for (let i = 0; i < hashes.length; i += MAX_HASHES) chunks.push(hashes.slice(i, i + MAX_HASHES));

  const respondedTrackers = new Set();
  const stats = new Map();
  await Promise.all(
    udpTrackers.flatMap((tracker) =>
      chunks.map(async (chunk) => {
        let result;
        try {
          result = await scrapeTracker(tracker, chunk, { timeout });
        } catch {
          return;
        }
        respondedTrackers.add(tracker);
        for (const [hash, s] of result) {
          const prev = stats.get(hash) ?? { seeders: 0, leechers: 0 };
          stats.set(hash, {
            seeders: Math.max(prev.seeders, s.seeders),
            leechers: Math.max(prev.leechers, s.leechers)
          });
        }
        onProgress?.(stats);
      })
    )
  );
  return { stats, responded: respondedTrackers.size };
}
