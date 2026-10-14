import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Start a local HTTP server; `handler(req, body)` returns { status, json | text }.
export async function startServer(handler) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      const reply = (await handler(req, body)) ?? { status: 404, text: 'not found' };
      const payload = reply.json !== undefined ? JSON.stringify(reply.json) : (reply.text ?? '');
      res.writeHead(reply.status ?? 200, {
        'content-type': reply.json !== undefined ? 'application/json' : 'text/plain'
      });
      res.end(payload);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, requests, close: () => new Promise((resolve) => server.close(resolve)) };
}

export function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'magsearch-test-'));
}

export function rawTorrent(overrides = {}) {
  return {
    id: '27915016',
    name: 'Blade.Runner.2049.2017.1080p.BluRay.H264.AAC',
    info_hash: 'F0F21AC2EF92698E8E9DB6E235CA77F6E05662A7',
    leechers: '115',
    seeders: '582',
    num_files: '4',
    size: '3370000000',
    username: 'Supernova',
    added: '1515000000',
    status: 'vip',
    category: '207',
    imdb: 'tt1856101',
    ...overrides
  };
}

export const NO_RESULTS = [
  {
    id: '0',
    name: 'No results returned',
    info_hash: '0000000000000000000000000000000000000000',
    leechers: '0',
    seeders: '0',
    num_files: '0',
    size: '0',
    username: '',
    added: '0',
    status: 'member',
    category: '0',
    imdb: ''
  }
];
