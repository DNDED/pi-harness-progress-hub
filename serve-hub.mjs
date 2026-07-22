import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3050;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_FILE = path.join(__dirname, 'src', 'data', 'updates.json');
const SUBAGENTS_FILE = path.join(__dirname, 'src', 'data', 'subagents.json');

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

const defaultSubagents = [
  {
    id: "sub-001",
    name: "Gemini 3.6 Flash Sentinel Worker",
    model: "Google Vertex Gemini 3.6 Flash",
    status: "Completed",
    durationMs: 1420,
    timestamp: new Date().toISOString(),
    tokensUsed: 840,
    task: "Execute 42 proactive safety sentinels across codebase",
  },
  {
    id: "sub-002",
    name: "Vite Progress Hub Bundler",
    model: "Local Node.js / Bun Runtime",
    status: "Completed",
    durationMs: 3200,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
    task: "Build and bundle Progress Hub static distribution",
  },
  {
    id: "sub-003",
    name: "Remotion Video Reel Synthesizer",
    model: "Remotion 30 FPS Renderer",
    status: "Completed",
    durationMs: 4100,
    timestamp: new Date().toISOString(),
    tokensUsed: 120,
    task: "Synthesize progress video composition frames",
  },
];

if (!fs.existsSync(SUBAGENTS_FILE)) {
  try {
    fs.mkdirSync(path.dirname(SUBAGENTS_FILE), { recursive: true });
    fs.writeFileSync(SUBAGENTS_FILE, JSON.stringify(defaultSubagents, null, 2), 'utf-8');
  } catch {}
}

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

  // API Endpoint: /api/subagents
  if (pathname === '/api/subagents') {
    if (req.method === 'GET') {
      try {
        const content = fs.readFileSync(SUBAGENTS_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(content);
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(defaultSubagents));
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
          if (fs.existsSync(SUBAGENTS_FILE)) {
            current = JSON.parse(fs.readFileSync(SUBAGENTS_FILE, 'utf-8'));
          }
          current.unshift(newItem);
          fs.writeFileSync(SUBAGENTS_FILE, JSON.stringify(current, null, 2), 'utf-8');
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
