#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;
const publicDir = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Default to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Build file path
  const filePath = path.join(publicDir, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Try to read file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, try index.html
        fs.readFile(path.join(publicDir, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>Mobile App Preview</title>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: #0a0a0a;
                    color: #fff;
                  }
                  .container {
                    text-align: center;
                    padding: 40px;
                  }
                  h1 { color: #4ade80; }
                  p { color: #aaa; margin: 20px 0; }
                  code {
                    display: block;
                    background: #1a1a1a;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-family: monospace;
                    text-align: left;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Peg Slam Mobile App Preview</h1>
                  <p>Exporting web version...</p>
                  <p>Run this command to generate the web preview:</p>
                  <code>cd PegSlamMobile && npx expo export --platform web</code>
                  <p>Then restart the server to see your app!</p>
                </div>
              </body>
              </html>
            `);
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      return;
    }

    // Set content type
    const ext = path.extname(filePath);
    let contentType = 'application/octet-stream';
    if (ext === '.html') contentType = 'text/html';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.woff') contentType = 'font/woff';
    else if (ext === '.woff2') contentType = 'font/woff2';

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Mobile App Preview running at http://0.0.0.0:' + PORT);
  console.log('Open http://localhost:' + PORT + ' in your browser');
  console.log('\nTo generate web version, run: cd PegSlamMobile && npx expo export --platform web');
});
