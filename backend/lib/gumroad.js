/**
 * Gumroad webhook: verify and parse sale payload.
 * Gumroad sends form-urlencoded or JSON; we accept JSON.
 * See: https://help.gumroad.com/article/289-webhooks
 */

/**
 * Parse sale payload from Gumroad webhook body.
 * Gumroad may send: email, purchaser_email, product_id, order_number, etc.
 * @param {object} body - Parsed JSON body from POST.
 * @returns {{ email: string, name?: string } | null} - Buyer email and optional name, or null if invalid.
 */
function parseSalePayload(body) {
  if (!body || typeof body !== 'object') return null;

  // Gumroad uses various field names; accept common ones.
  const email =
    body.email ||
    body.purchaser_email ||
    body.buyer_email ||
    (body.purchase && body.purchase.email);
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;

  const name =
    body.name ||
    body.purchaser_name ||
    body.buyer_name ||
    (body.purchase && (body.purchase.name || body.purchase.purchaser_name));
  const nameStr = name && typeof name === 'string' ? name.trim() : undefined;

  return { email: email.trim(), name: nameStr };
}

/**
 * Verify webhook signature if GUMROAD_WEBHOOK_SECRET is set.
 * Gumroad may send a signature header; implementation depends on Gumroad's docs.
 * For now we only parse; add signature check when Gumroad provides the format.
 * @param {object} req - Express request (headers, body).
 * @param {string} [secret] - Optional webhook secret from env.
 * @returns {boolean}
 */
function verifyWebhookSignature(req, secret) {
  if (!secret) return true;
  const sig = req.headers['x-gumroad-signature'] || req.headers['x-webhook-signature'];
  if (!sig) return false;
  // Gumroad signature format: typically HMAC of body. Add exact verification when documented.
  // For now, presence of secret + signature can be extended later.
  return Boolean(sig);
}

module.exports = {
  parseSalePayload,
  verifyWebhookSignature,
};
