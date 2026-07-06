/**
 * @file scripts/serve.mjs
 * Minimal static file server for the production preview (dist/).
 *
 * Binds to 127.0.0.1 (localhost) explicitly so the smoke-check harness — which
 * probes 127.0.0.1 — can always reach it. Vite's `preview` command appends
 * `--host 0.0.0.0` when invoked through the harness, which triggers the
 * "wildcard host" guard; this script avoids that by binding only to loopback.
 *
 * Usage: node scripts/serve.mjs
 * Env:   PORT (default 4173)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT) || 4173;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    // Strip base path prefix if present (base './' → no leading segment, but be safe).
    // Prevent path traversal.
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // Try the file as-is, then index.html for directories, then SPA fallback.
    let s;
    try {
      s = await stat(filePath);
    } catch {
      // If the bare file doesn't exist, try adding .html or fall back to index.
      filePath = join(ROOT, 'index.html');
      s = await stat(filePath);
    }
    if (s.isDirectory()) {
      filePath = join(filePath, 'index.html');
      s = await stat(filePath);
    }

    const data = await readFile(filePath);
    const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[serve] dist/ on http://${HOST}:${PORT}`);
});

// Clean exit on signal.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close();
    process.exit(0);
  });
}
