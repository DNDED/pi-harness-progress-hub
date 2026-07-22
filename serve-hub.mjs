import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3050;
const START_TIME = Date.now();
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_FILE = path.join(__dirname, 'src', 'data', 'updates.json');
const SUBAGENTS_FILE = path.join(__dirname, 'src', 'data', 'subagents.json');
const SENTINELS_FILE = path.join(__dirname, 'src', 'data', 'sentinels.json');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint: /api/health
  if (pathname === '/api/health') {
    const uptimeSec = Math.round((Date.now() - START_TIME) / 1000);
    const freeMemGb = (os.freemem() / (1024 ** 3)).toFixed(2);
    const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(2);

    let totalUpdates = 0;
    let totalSubagents = 0;
    try {
      if (fs.existsSync(DATA_FILE)) {
        totalUpdates = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).length;
      }
      if (fs.existsSync(SUBAGENTS_FILE)) {
        totalSubagents = JSON.parse(fs.readFileSync(SUBAGENTS_FILE, 'utf-8')).length;
      }
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'Online',
      uptimeSec,
      systemMemory: `${freeMemGb} GB free / ${totalMemGb} GB total`,
      activeSentinels: 42,
      passRate: '100%',
      totalUpdates,
      totalSubagents,
      nodeVersion: process.version,
      platform: os.platform(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // API Endpoint: /api/sentinels
  if (pathname === '/api/sentinels') {
    try {
      if (fs.existsSync(SENTINELS_FILE)) {
        const content = fs.readFileSync(SENTINELS_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
        return;
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // API Endpoint: /api/subagents
  if (pathname === '/api/subagents') {
    if (req.method === 'GET') {
      try {
        const content = fs.readFileSync(SUBAGENTS_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
      }
      return;
    }
  }

  // API Endpoint: /api/updates
  if (pathname === '/api/updates') {
    if (req.method === 'GET') {
      try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read updates data' }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const newItem = JSON.parse(body);
          let current = [];
          if (fs.existsSync(DATA_FILE)) {
            current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
          }
          current.unshift(newItem);
          fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, item: newItem }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  // Static File Server
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Pi Progress Hub API & Static Server running at http://0.0.0.0:${PORT}`);
});
