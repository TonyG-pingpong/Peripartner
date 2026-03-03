/**
 * Stripe webhook: verify event and extract buyer info.
 */

const Stripe = require('stripe');

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

/**
 * Verify webhook and return the Stripe event.
 * @param {Buffer} rawBody - Raw request body buffer
 * @param {string} signature - Stripe-Signature header
 * @returns {object} event
 */
function constructEvent(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Extract buyer email and name from a Checkout Session.
 * @param {object} session - Stripe Checkout Session object
 * @returns {{ email: string, name?: string } | null}
 */
function buyerFromCheckoutSession(session) {
  if (!session) return null;
  const details = session.customer_details || {};
  const email = details.email || session.customer_email;
  if (!email) return null;
  const name = details.name || undefined;
  return { email: email.trim(), name: name && name.trim() };
}

module.exports = {
  constructEvent,
  buyerFromCheckoutSession,
};

