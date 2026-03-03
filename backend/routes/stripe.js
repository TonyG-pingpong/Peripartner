/**
 * POST /api/webhook/stripe
 * Receives Stripe Checkout webhook, creates watermarked PDF, returns one-time download URL.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const stripeLib = require('../lib/stripe');
const watermark = require('../lib/watermark');
const onetime = require('../lib/onetime');
const stripeSessions = require('../store/stripeSessions');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// Info endpoint for GET (browser visit)
router.get('/stripe', (req, res) => {
  res.json({
    message: 'Peripartner Stripe webhook endpoint. Use POST from Stripe, not GET.',
    webhook: 'POST /api/webhook/stripe',
    events: ['checkout.session.completed'],
  });
});

// Stripe requires the raw body for signature verification (must not be parsed as JSON first)
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Missing Stripe-Signature header' });
      }

      // req.body must be the raw Buffer for signature verification
      const rawBody = Buffer.isBuffer(req.body) ? req.body : (req.body && typeof req.body === 'string' ? Buffer.from(req.body, 'utf8') : null);
      if (!rawBody || rawBody.length === 0) {
        console.error('Stripe webhook: body is empty or not raw. Ensure no global body parser runs before this route.');
        return res.status(400).json({ error: 'Invalid webhook body (raw body required)' });
      }

      let event;
      try {
        event = stripeLib.constructEvent(rawBody, signature);
      } catch (verifyErr) {
        const isSignatureError = verifyErr.type === 'StripeSignatureVerificationError';
        console.error('Stripe webhook signature verification failed:', isSignatureError ? 'wrong webhook secret or tampered payload' : verifyErr.message);
        return res.status(400).json({
          error: isSignatureError
            ? 'Webhook signature verification failed. Use the webhook secret from Stripe CLI (stripe listen) when testing locally.'
            : 'Invalid webhook payload',
        });
      }

      if (event.type !== 'checkout.session.completed') {
        // Ignore other events
        return res.status(200).json({ received: true, ignored: true, type: event.type });
      }

      const session = event.data && event.data.object;
      const buyer = stripeLib.buyerFromCheckoutSession(session);
      if (!buyer) {
        return res.status(400).json({ error: 'Unable to extract buyer email from Stripe session' });
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
      const baseUrl =
        (process.env.BASE_URL || '').replace(/\/$/, '') ||
        `http://localhost:${process.env.PORT || 4000}`;
      const { downloadUrl, expiresAt } = onetime.createOneTimeLink(
        token,
        pdfPath,
        baseUrl,
      );

      // Remember which Stripe Checkout Session produced this token so the
      // frontend success page can fetch the link using session_id.
      if (session && session.id) {
        stripeSessions.set(String(session.id), token, expiresAt.getTime());
      }

      console.log('[Stripe] Purchase completed:', buyer.email, '| PDF saved at:', pdfPath);

      res.status(200).json({
        success: true,
        downloadUrl,
        expiresAt: expiresAt.toISOString(),
        message:
          'Stripe purchase processed; watermarked PDF ready. Link valid for 24 hours, one-time use.',
      });
    } catch (err) {
      console.error('Stripe webhook error:', err);
      res.status(500).json({ error: 'Failed to handle Stripe webhook' });
    }
  },
);

module.exports = router;

