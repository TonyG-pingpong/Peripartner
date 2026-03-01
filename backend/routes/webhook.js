/**
 * POST /api/webhook/gumroad
 * Receives Gumroad sale event, creates watermarked PDF, returns one-time download URL.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const gumroad = require('../lib/gumroad');
const watermark = require('../lib/watermark');
const tokenStore = require('../store/tokens');
const onetime = require('../lib/onetime');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// GET: show info (browser visit). Gumroad sends POST.
router.get('/gumroad', (req, res) => {
  res.json({
    message: 'Peripartner webhook endpoint. Use POST (from Gumroad), not GET.',
    webhook: 'POST /api/webhook/gumroad',
    body: 'JSON with buyer email (e.g. email, purchaser_email, or purchase.email)',
  });
});

router.post('/gumroad', express.json(), async (req, res) => {
  try {
    const secret = process.env.GUMROAD_WEBHOOK_SECRET;
    if (!gumroad.verifyWebhookSignature(req, secret)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const buyer = gumroad.parseSalePayload(req.body);
    if (!buyer) {
      return res.status(400).json({ error: 'Missing or invalid buyer email in payload' });
    }

    const masterPath = process.env.MASTER_PDF_PATH;
    if (!masterPath) {
      return res.status(500).json({ error: 'MASTER_PDF_PATH not configured' });
    }
    const resolvedMaster = path.isAbsolute(masterPath)
      ? masterPath
      : path.join(__dirname, '..', masterPath);
    if (!fs.existsSync(resolvedMaster)) {
      return res.status(500).json({ error: 'Master PDF not found' });
    }

    ensureTempDir();
    const token = crypto.randomBytes(32).toString('hex');
    const pdfPath = path.resolve(TEMP_DIR, `${token}.pdf`);

    await watermark.createWatermarkedPdf(resolvedMaster, pdfPath, buyer);
    const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '') || `http://localhost:${process.env.PORT || 4000}`;
    const { downloadUrl, expiresAt } = onetime.createOneTimeLink(token, pdfPath, baseUrl);

    res.status(200).json({
      success: true,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      message: 'Watermarked PDF ready; link valid for 24 hours, one-time use.',
    });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Failed to create download link' });
  }
});

module.exports = router;
