const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Generate self-signed certificate if not exists
function generateCert() {
  const { execSync } = require('child_process');
  
  try {
    if (!fs.existsSync('cert.pem') || !fs.existsSync('key.pem')) {
      console.log('Generating self-signed certificate...');
      execSync('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"');
      console.log('Certificate generated successfully!');
    }
  } catch (error) {
    console.log('Could not generate certificate, creating simple ones...');
    // Create simple cert files for development
    fs.writeFileSync('key.pem', `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wQNfBEXzYmbiwCgNCfbQ/rZdT8OGXC5NjCxUhd2lzx1jYxSCW2YqOhHjMhYCLhpN
Nt5D3jWFjFd3OElRjsNLJr3F0pCjmQ2oFl0cPJpn3Vsd9Zg3qe0aKGYjWjNLBf5p
-----END PRIVATE KEY-----`);
    
    fs.writeFileSync('cert.pem', `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODI5MDIxNzEzWhcNMTgwODI5MDIxNzEzWjBF
-----END CERTIFICATE-----`);
  }
}

const port = process.env.PORT || 9443;

// Generate certificate
generateCert();

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  const ext = path.parse(filePath).ext;
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  // Security check - don't serve files outside current directory
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 Not Found</h1>
          <p>The requested URL ${pathname} was not found on this server.</p>
        </body>
        </html>
      `);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.end(data);
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 HTTPS Server running at https://localhost:${port}/`);
  console.log(`📱 For mobile testing: https://[your-ip]:${port}/`);
  console.log('');
  console.log('📄 Available pages:');
  console.log(`   • https://localhost:${port}/             - Homepage`);
  console.log(`   • https://localhost:${port}/baiwan.html  - 百万进度`);
  console.log(`   • https://localhost:${port}/price.html   - Price Tracker`);
  console.log('');
  console.log('⚠️  You may see a security warning about the self-signed certificate.');
  console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});