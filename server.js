#!/usr/bin/env node
/**
 * Zero-dependency static file server for the Café Time Period Timelapse.
 *
 * WHY THIS EXISTS
 *   The app is built with ES modules (`<script type="module">`) plus a Three.js
 *   importmap. Browsers block ES-module scripts when a page is opened via the
 *   `file://` protocol — that surfaces as a black screen with CORS errors such
 *   as "Cross origin requests are only supported for protocol schemes: ...
 *   http, https" and "'file:' URLs are treated as unique security origins".
 *
 *   Serve the project over HTTP instead and the modules load correctly:
 *
 *       npm start            # then open http://localhost:8000
 *
 *   (Alternatively: `npx serve .` or any static server — `file://` will not
 *   work because of browser module/CORS restrictions.)
 *
 * Only Node.js built-ins are used, so no `npm install` is required.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL('.', import.meta.url).pathname.replace(/^\//, ''));
const PORT = Number(process.env.PORT) || 8000;

/** MIME map — `.js` MUST be served as a JavaScript MIME so module scripts load. */
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
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const server = http.createServer((req, res) => {
  // Decode + normalize the URL pathname, guarding against path traversal.
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = path.resolve(ROOT, '.' + urlPath);

  // Prevent access outside the project root.
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      // Serve index.html for the root or any directory.
      const indexFile = path.join(filePath, 'index.html');
      fs.readFile(indexFile, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data);
      });
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('\n  Café Time Period Timelapse');
  console.log(`  → http://localhost:${PORT}\n`);
});
