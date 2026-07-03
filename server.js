/*
 * Simple static file server for production builds.
 * Usage: node server.js  (after `npm run build`)
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(__dirname, 'dist');
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let path = normalize(decodeURIComponent(url.pathname));
    if (path === '/') path = '/index.html';

    const filePath = join(DIST_DIR, path);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        // Serve index.html for directory paths (SPA fallback)
        const indexFile = join(filePath, 'index.html');
        const data = await readFile(indexFile);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
        return;
      }
    } catch {
      // File doesn't exist, try SPA fallback
      const fallback = join(DIST_DIR, 'index.html');
      try {
        const data = await readFile(fallback);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
        return;
      } catch {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
    }

    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end(`Internal Server Error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`Café Timelapse production server running at http://localhost:${PORT}`);
});
