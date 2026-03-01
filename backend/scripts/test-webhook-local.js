/**
 * Test webhook locally (no payment). Run: node scripts/test-webhook-local.js
 * Backend must be running: npm start
 */

const http = require('http');

const body = JSON.stringify({
  email: 'test@example.com',
  name: 'Test Buyer',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 4000,
    path: '/api/webhook/gumroad',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.downloadUrl) {
          console.log('Success!');
          console.log('Download URL (valid 24h, one-time use):');
          console.log(json.downloadUrl);
          console.log('\nOpen the URL above in your browser to download the watermarked PDF.');
          console.log('Expires:', json.expiresAt);
        } else {
          console.log('Response:', json);
        }
      } catch (e) {
        console.log('Response:', data);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('Error:', err.message);
  console.log('Make sure the backend is running: npm start');
  process.exit(1);
});

req.write(body);
req.end();
