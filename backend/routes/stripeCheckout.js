/**
 * GET /api/stripe/checkout
 * Creates a live Stripe Checkout Session and redirects the buyer to hosted checkout.
 * Replaces static Payment Links (which 404 if deactivated or invalid).
 */

const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

const DEFAULT_SUCCESS_URL =
  'https://www.peripartner.com/success.html?session_id={CHECKOUT_SESSION_ID}';
const DEFAULT_CANCEL_URL = 'https://www.peripartner.com/checkout.html';

router.get('/checkout', async (req, res) => {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!secretKey) {
      return res.status(500).send('Payment is not configured (missing STRIPE_SECRET_KEY).');
    }
    if (!priceId) {
      return res.status(500).send(
        'Payment is not configured (missing STRIPE_PRICE_ID). Add your live Price ID in Render environment variables.'
      );
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL || DEFAULT_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL || DEFAULT_CANCEL_URL,
    });

    if (!session.url) {
      return res.status(500).send('Could not start checkout. Please try again.');
    }

    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Stripe checkout redirect failed:', err.message);
    return res.status(500).send(
      'Unable to start checkout. Check STRIPE_PRICE_ID and STRIPE_SECRET_KEY on the server.'
    );
  }
});

module.exports = router;
