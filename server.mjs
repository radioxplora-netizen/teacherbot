// Simple static server with node_modules resolution for ESM imports
// Serves SWC-transpiled JS files and resolves bare imports to node_modules

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist-js');
const NODE_MODULES = path.join(ROOT, 'node_modules', '.pnpm');

const PORT = 3002;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

function findInPnpm(name) {
  // Search for the module in pnpm's virtual store
  const dir = path.join(NODE_MODULES);
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(name.replace('/', '+') + '@')) {
        return path.join(dir, entry, 'node_modules', name);
      }
    }
  } catch (e) {}
  return null;
}

function findModuleFile(modulePath) {
  // Already has a file path
  const ext = path.extname(modulePath);
  if (ext) return modulePath;
  
  // Try index.js
  const withIndex = path.join(modulePath, 'index.js');
  if (fs.existsSync(withIndex)) return withIndex;
  
  // Try .js extension
  const withExt = modulePath + '.js';
  if (fs.existsSync(withExt)) return withExt;
  
  // Try reading package.json for "main" or "module"
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));
    if (pkg.module) return path.join(modulePath, pkg.module);
    if (pkg.main) return path.join(modulePath, pkg.main);
  } catch(e) {}
  
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = url.pathname;
  
  // Root serves index.html
  if (filePath === '/') filePath = '/index.html';
  
  // Try serving from DIST first
  let fullPath = path.join(DIST, filePath);
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(fs.readFileSync(fullPath));
    return;
  }
  
  // Try node_modules resolution (for bare imports)
  // These come in as /@tanstack/react-query or /react
  if (filePath.startsWith('/@') || filePath.match(/^\/[a-z]/)) {
    const moduleName = filePath.slice(1); // remove leading /
    
    // Find in pnpm
    let moduleDir = findInPnpm(moduleName);
    
    if (moduleDir) {
      const moduleFile = findModuleFile(moduleDir);
      if (moduleFile && fs.existsSync(moduleFile)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*' });
        res.end(fs.readFileSync(moduleFile));
        return;
      }
    }
  }
  
  // Try falling back to root directory (for public/ files)
  fullPath = path.join(ROOT, filePath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(fullPath));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found: ' + filePath);
});

server.listen(PORT, () => {
  console.log(`TeacherIA dev server on http://localhost:${PORT}`);
  console.log(`Serving: ${DIST}`);
});
