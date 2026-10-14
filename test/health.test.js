import { test } from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import { scrape, scrapeTracker } from '../lib/health.js';

const HASH_A = 'f0f21ac2ef92698e8e9db6e235ca77f6e05662a7';
const HASH_B = '4a3f5e08bcef825718eda30637230585e3330599';

// A minimal BEP 15 tracker. `counts(i)` gives [seeders, completed, leechers].
async function startTracker({ counts = () => [10, 50, 3], error, silent = false } = {}) {
  const socket = dgram.createSocket('udp4');
  const connectionId = 0x1122334455667788n;
  socket.on('message', (msg, peer) => {
    if (silent) return;
    const action = msg.readUInt32BE(8);
    const tid = msg.readUInt32BE(12);
    let reply;
    if (action === 0) {
      assert.equal(msg.readBigUInt64BE(0), 0x41727101980n);
      reply = Buffer.alloc(16);
      reply.writeUInt32BE(0, 0);
      reply.writeUInt32BE(tid, 4);
      reply.writeBigUInt64BE(connectionId, 8);
    } else if (action === 2 && error) {
      reply = Buffer.concat([Buffer.alloc(8), Buffer.from(error)]);
      reply.writeUInt32BE(3, 0);
      reply.writeUInt32BE(tid, 4);
    } else if (action === 2) {
      assert.equal(msg.readBigUInt64BE(0), connectionId);
      const n = (msg.length - 16) / 20;
      reply = Buffer.alloc(8 + n * 12);
      reply.writeUInt32BE(2, 0);
      reply.writeUInt32BE(tid, 4);
      for (let i = 0; i < n; i++) {
        const [s, c, l] = counts(i);
        reply.writeUInt32BE(s, 8 + i * 12);
        reply.writeUInt32BE(c, 12 + i * 12);
        reply.writeUInt32BE(l, 16 + i * 12);
      }
    }
    socket.send(reply, peer.port, peer.address);
  });
  await new Promise((resolve) => socket.bind(0, '127.0.0.1', resolve));
  return {
    url: `udp://127.0.0.1:${socket.address().port}/announce`,
    close: () => socket.close()
  };
}

test('scrapeTracker reads counts for each hash', async (t) => {
  const tracker = await startTracker({ counts: (i) => [100 + i, 7, 20 + i] });
  t.after(tracker.close);
  const stats = await scrapeTracker(tracker.url, [HASH_A, HASH_B.toUpperCase()], { timeout: 2000 });
  assert.deepEqual(stats.get(HASH_A), { seeders: 100, completed: 7, leechers: 20 });
  assert.deepEqual(stats.get(HASH_B), { seeders: 101, completed: 7, leechers: 21 });
});

test('scrapeTracker surfaces tracker errors and timeouts', async (t) => {
  const failing = await startTracker({ error: 'torrent not registered' });
  const silent = await startTracker({ silent: true });
  t.after(() => {
    failing.close();
    silent.close();
  });
  await assert.rejects(scrapeTracker(failing.url, [HASH_A], { timeout: 2000 }), /torrent not registered/);
  await assert.rejects(scrapeTracker(silent.url, [HASH_A], { timeout: 200 }), /did not answer/);
  await assert.rejects(scrapeTracker('http://example.com/announce', [HASH_A]), /Not a UDP tracker/);
});

test('scrape keeps the highest counts across trackers and reports progress', async (t) => {
  const low = await startTracker({ counts: () => [5, 0, 50] });
  const high = await startTracker({ counts: () => [40, 0, 2] });
  const silent = await startTracker({ silent: true });
  t.after(() => [low, high, silent].forEach((tr) => tr.close()));

  let progressCalls = 0;
  const { stats, responded } = await scrape(
    [HASH_A, HASH_A.toUpperCase(), 'not-a-hash'],
    [low.url, high.url, silent.url, 'http://ignored.example/announce'],
    { timeout: 300, onProgress: () => progressCalls++ }
  );
  assert.equal(responded, 2);
  assert.equal(progressCalls, 2);
  assert.equal(stats.size, 1);
  assert.deepEqual(stats.get(HASH_A), { seeders: 40, leechers: 50 });
});
