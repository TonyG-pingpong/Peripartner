/**
 * Peripartner backend: webhook → watermark PDF → one-time 24h download link.
 */

require('dotenv').config();
const express = require('express');
const webhookRoutes = require('./routes/webhook');
const downloadRoutes = require('./routes/download');
const stripeWebhookRoutes = require('./routes/stripe');
const stripeFulfillRoutes = require('./routes/stripeFulfill');

const app = express();
const PORT = process.env.PORT || 4000;

// Minimal CORS for local testing (frontend at :3000 calling backend at :4000).
// Set CORS_ORIGIN to a specific origin to tighten it (e.g. http://localhost:3000).
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Stripe-Signature');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/webhook', webhookRoutes);
app.use('/api/webhook', stripeWebhookRoutes);
app.use('/api/stripe', stripeFulfillRoutes);
app.use('/d', downloadRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'peripartner-backend' });
});

app.listen(PORT, () => {
  console.log(`Peripartner backend running at http://localhost:${PORT}`);
  console.log('  Webhook (Gumroad): POST /api/webhook/gumroad');
  console.log('  Webhook (Stripe):  POST /api/webhook/stripe');
  console.log('  Fulfill (Stripe):  GET  /api/stripe/fulfill?session_id=cs_...');
  console.log('  Download: GET /d/:token');
});
