#!/usr/bin/env node

/**
 * Local Development Server for EmotionLens AI Dashboard
 * Run with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - File Not Found');
      return;
    }

    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.json') contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           🚀 LOCAL EMOTION DASHBOARD SERVER RUNNING           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Server started at: http://${HOST}:${PORT}/`);
  console.log(`\n📝 Features:`);
  console.log('   ✓ Real-time emotion detection demo');
  console.log('   ✓ Live metrics and charts');
  console.log('   ✓ Pause/Resume controls');
  console.log('   ✓ Tab navigation (Overview & Metrics)');
  console.log('\n⌨️  Controls:');
  console.log('   • Click emotion bars to filter timeline');
  console.log('   • Use Pause/Resume to control live updates');
  console.log('   • Switch between Overview and Metrics tabs\n');
  console.log('Press Ctrl+C to stop the server\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
