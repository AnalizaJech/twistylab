// Verification server only; GitHub Pages serves dist directly.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
};
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/twistylab/')) {
      res.writeHead(302, { Location: '/twistylab/' }).end();
      return;
    }
    const path = resolve(root, decodeURIComponent(url.pathname.slice(11)) || 'index.html');
    if (!path.startsWith(root + sep) && path !== root) {
      res.writeHead(403).end();
      return;
    }
    try {
      const contents = await readFile(path);
      res.writeHead(200, {
        'Content-Type': types[extname(path)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(contents);
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(4173, '127.0.0.1', () =>
    console.log('Production subpath preview: http://127.0.0.1:4173/twistylab/'),
  );
