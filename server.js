const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4200;
const DIST_DIR = path.join(__dirname, 'dist', 'capitalloop-admin-portal');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Gracefully handle dead ng-cli-ws polling from old browser tabs
  if (req.url.startsWith('/ng-cli-ws')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('No WebSocket needed in production');
    return;
  }

  // Gracefully silence favicon requests
  if (req.url === '/favicon.ico' || req.url.endsWith('/favicon.ico')) {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse path without query strings
  let cleanUrl = req.url.split('?')[0].split('#')[0];
  if (cleanUrl.startsWith('/CapitalLoop.Web/')) {
    cleanUrl = cleanUrl.replace('/CapitalLoop.Web', '');
  } else if (cleanUrl === '/CapitalLoop.Web') {
    cleanUrl = '/';
  }
  let relativePath = cleanUrl === '/' ? '/index.html' : cleanUrl;
  let targetPath = path.normalize(path.join(DIST_DIR, relativePath));

  // Security check against directory traversal
  if (!targetPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists, else fallback to index.html (SPA client-side routing)
  fs.stat(targetPath, (err, stats) => {
    if (err || !stats.isFile()) {
      targetPath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(targetPath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SPAServer] Production SPA server running at http://localhost:${PORT}/`);
  console.log(`[SPAServer] Serving files from: ${DIST_DIR}`);
});
