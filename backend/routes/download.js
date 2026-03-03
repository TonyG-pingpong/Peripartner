/**
 * GET /d/:token
 * One-time download: stream PDF once, then invalidate the link.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const tokenStore = require('../store/tokens');

const router = express.Router();
const DOWNLOAD_FILENAME = 'peripartner-guide.pdf';

router.get('/:token', (req, res) => {
  const { token } = req.params;
  const entry = tokenStore.get(token);

  if (!entry) {
    return res.status(410).send('This download link has expired or has already been used.');
  }

  const pdfPath = path.isAbsolute(entry.pdfPath) ? entry.pdfPath : path.join(__dirname, '..', entry.pdfPath);

  if (!fs.existsSync(pdfPath)) {
    tokenStore.consume(token);
    return res.status(404).send('File not found.');
  }

  tokenStore.consume(token);
  console.log('[Download] Serving PDF for token', token.substring(0, 8) + '...');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${DOWNLOAD_FILENAME}"`);

  const stream = fs.createReadStream(pdfPath);
  stream.pipe(res);
  stream.on('end', () => {
    try {
      fs.unlinkSync(pdfPath);
    } catch (e) {
      console.warn('Could not delete temp file:', pdfPath, e.message);
    }
  });
  stream.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) res.status(500).send('Download failed.');
  });
});

module.exports = router;
