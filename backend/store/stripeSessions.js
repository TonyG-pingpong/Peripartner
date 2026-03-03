/**
 * In-memory mapping: Stripe Checkout Session ID -> download token.
 * Lets the frontend success page fetch the one-time download URL using `session_id`.
 *
 * Each entry: { token, expiresAt } where expiresAt is epoch ms.
 */
const store = new Map();

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function set(sessionId, token, expiresAtMs) {
  const expiresAt =
    typeof expiresAtMs === 'number' && Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : Date.now() + TWENTY_FOUR_HOURS_MS;
  store.set(sessionId, { token, expiresAt });
}

function get(sessionId) {
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(sessionId);
    return null;
  }
  return { token: entry.token, expiresAt: new Date(entry.expiresAt) };
}

module.exports = {
  set,
  get,
};

