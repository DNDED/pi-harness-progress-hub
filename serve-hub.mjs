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

const defaultSentinels = [
  { id: "s-01", name: "HTML Tag Mismatch Sentinel", category: "DOM / Syntax", status: "Passing", speedMs: 0.4 },
  { id: "s-02", name: "Unused Imports Sentinel", category: "Hygiene", status: "Passing", speedMs: 0.3 },
  { id: "s-03", name: "Dead Dependencies Sentinel", category: "Hygiene", status: "Passing", speedMs: 0.5 },
  { id: "s-04", name: "Lockfile Sentinel", category: "Dependencies", status: "Passing", speedMs: 0.2 },
  { id: "s-05", name: "Tailwind CSS Sentinel", category: "UI / Styling", status: "Passing", speedMs: 0.3 },
  { id: "s-06", name: "JSON Formatting Sentinel", category: "Syntax", status: "Passing", speedMs: 0.1 },
  { id: "s-07", name: "Regex Safety Sentinel", category: "Security", status: "Passing", speedMs: 0.2 },
  { id: "s-08", name: "CSS Syntax Sentinel", category: "UI / Styling", status: "Passing", speedMs: 0.3 },
  { id: "s-09", name: "SQL Injection Guard Sentinel", category: "Security", status: "Passing", speedMs: 0.4 },
  { id: "s-10", name: "Memory Leak Sentinel", category: "Performance", status: "Passing", speedMs: 0.6 },
  { id: "s-11", name: "Prototype Pollution Sentinel", category: "Security", status: "Passing", speedMs: 0.3 },
  { id: "s-12", name: "Global Scope Pollute Sentinel", category: "Hygiene", status: "Passing", speedMs: 0.2 },
  { id: "s-13", name: "Promise Handling Sentinel", category: "Async", status: "Passing", speedMs: 0.4 },
  { id: "s-14", name: "Float Overflow Sentinel", category: "Math", status: "Passing", speedMs: 0.1 },
  { id: "s-15", name: "Mutation Guard Sentinel", category: "State", status: "Passing", speedMs: 0.3 },
  { id: "s-16", name: "Destructure Safety Sentinel", category: "Syntax", status: "Passing", speedMs: 0.2 },
  { id: "s-17", name: "NaN Guard Sentinel", category: "Math", status: "Passing", speedMs: 0.1 },
  { id: "s-18", name: "Contrast Access Sentinel", category: "Accessibility", status: "Passing", speedMs: 0.5 },
  { id: "s-19", name: "Sort Immutability Sentinel", category: "State", status: "Passing", speedMs: 0.2 },
  { id: "s-20", name: "JSON Parse Catch Sentinel", category: "Robustness", status: "Passing", speedMs: 0.3 },
  { id: "s-21", name: "Shallow Copy Guard Sentinel", category: "State", status: "Passing", speedMs: 0.2 },
  { id: "s-22", name: "Conditional Complexity Sentinel", category: "Maintainability", status: "Passing", speedMs: 0.4 },
  { id: "s-23", name: "Non-Null Assertion Sentinel", category: "TypeScript", status: "Passing", speedMs: 0.3 },
  { id: "s-24", name: "Crypto Weak Key Sentinel", category: "Security", status: "Passing", speedMs: 0.2 },
  { id: "s-25", name: "Key Stability Sentinel", category: "React / Framework", status: "Passing", speedMs: 0.3 },
  { id: "s-26", name: "Array Bounds Sentinel", category: "Robustness", status: "Passing", speedMs: 0.2 },
  { id: "s-27", name: "Sync IO Block Sentinel", category: "Performance", status: "Passing", speedMs: 0.5 },
  { id: "s-28", name: "Stateful Regex Sentinel", category: "Syntax", status: "Passing", speedMs: 0.2 },
  { id: "s-29", name: "Infinite Loop Sentinel", category: "Robustness", status: "Passing", speedMs: 0.4 },
  { id: "s-30", name: "Observer Leak Sentinel", category: "Performance", status: "Passing", speedMs: 0.5 },
  { id: "s-31", name: "Exhaustiveness Sentinel", category: "TypeScript", status: "Passing", speedMs: 0.3 },
  { id: "s-32", name: "Immutability Guard Sentinel", category: "State", status: "Passing", speedMs: 0.2 },
  { id: "s-33", name: "Input Mixing Guard Sentinel", category: "Security", status: "Passing", speedMs: 0.3 },
  { id: "s-34", name: "Mutable Defaults Sentinel", category: "Hygiene", status: "Passing", speedMs: 0.2 },
  { id: "s-35", name: "ZIndex Stacking Sentinel", category: "UI / Styling", status: "Passing", speedMs: 0.3 },
  { id: "s-36", name: "Vue Ref Safety Sentinel", category: "Frameworks", status: "Passing", speedMs: 0.2 },
  { id: "s-37", name: "React Rules of Hooks Sentinel", category: "React / Framework", status: "Passing", speedMs: 0.4 },
  { id: "s-38", name: "DOM / Ref Access Sentinel", category: "DOM / React", status: "Passing", speedMs: 0.3 },
  { id: "s-39", name: "Event Callback Guard Sentinel", category: "UI / Events", status: "Passing", speedMs: 0.3 },
  { id: "s-40", name: "Token-Saving Compactor Sentinel", category: "Optimization", status: "Passing", speedMs: 0.6 },
  { id: "s-41", name: "Content-Hash Sentinel Cache", category: "Optimization", status: "Passing", speedMs: 0.2 },
  { id: "s-42", name: "Token Repetition Sentinel", category: "Optimization", status: "Passing", speedMs: 0.3 }
];

if (!fs.existsSync(SENTINELS_FILE)) {
  try {
    fs.mkdirSync(path.dirname(SENTINELS_FILE), { recursive: true });
    fs.writeFileSync(SENTINELS_FILE, JSON.stringify(defaultSentinels, null, 2), 'utf-8');
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

  // API Endpoint: /api/sentinels
  if (pathname === '/api/sentinels') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(defaultSentinels));
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
