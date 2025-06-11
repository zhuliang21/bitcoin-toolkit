const https = require('https');
const fs = require('fs');
const path = require('path');

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create minimal self-signed certificate if it doesn't exist
if (!fs.existsSync('simple.key') || !fs.existsSync('simple.crt')) {
    const { execSync } = require('child_process');
    
    console.log('Creating minimal certificate for iOS compatibility...');
    
    // Create simple certificate that iOS might accept better
    try {
        execSync('openssl genrsa -out simple.key 2048', { stdio: 'inherit' });
        execSync(`openssl req -new -x509 -key simple.key -out simple.crt -days 365 -subj "/CN=*.ngrok.io" -extensions v3_ca`, { stdio: 'inherit' });
        console.log('✅ Certificate created');
    } catch (error) {
        console.error('Certificate creation failed:', error.message);
        process.exit(1);
    }
}

const options = {
    key: fs.readFileSync('simple.key'),
    cert: fs.readFileSync('simple.crt'),
    // More permissive SSL options for testing
    rejectUnauthorized: false,
    requestCert: false,
    agent: false
};

const server = https.createServer(options, (req, res) => {
    // Add CORS headers for mobile compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + req.url);
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(9443, () => {
    console.log('🔒 Simple HTTPS Server running at:');
    console.log('   https://localhost:9443/bbqr-reader.html');
    console.log('📱 For iPhone testing:');
    console.log('   https://192.168.8.157:9443/bbqr-reader.html');
    console.log('');
    console.log('📋 Testing Steps for iPhone:');
    console.log('1. Connect iPhone and Mac to same WiFi');
    console.log('2. Open Safari on iPhone');  
    console.log('3. Go to: https://192.168.8.157:9443/bbqr-reader.html');
    console.log('4. When you see security warning:');
    console.log('   - Tap "Advanced" or "高级"');
    console.log('   - Tap "Proceed to 192.168.8.157 (unsafe)" or "继续前往"');
    console.log('5. The page should load and camera should work!');
    console.log('');
    console.log('💡 If it still doesn\'t work, try:');
    console.log('   - Restart Safari app completely');
    console.log('   - Clear Safari cache: Settings > Safari > Clear History');
    console.log('   - Try in private browsing mode');
}); 