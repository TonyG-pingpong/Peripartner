/**
 * Peripartner backend: webhook → watermark PDF → one-time 24h download link.
 */

require('dotenv').config();
const express = require('express');
const webhookRoutes = require('./routes/webhook');
const downloadRoutes = require('./routes/download');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use('/api/webhook', webhookRoutes);
app.use('/d', downloadRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'peripartner-backend' });
});

app.listen(PORT, () => {
  console.log(`Peripartner backend running at http://localhost:${PORT}`);
  console.log('  Webhook:  POST /api/webhook/gumroad');
  console.log('  Download: GET /d/:token');
});
