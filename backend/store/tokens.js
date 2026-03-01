/**
 * In-memory store for one-time download tokens.
 * Each entry: { pdfPath, expiresAt, consumed }.
 * Token is the key.
 */

const store = new Map();

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Create a new one-time token for a PDF file.
 * @param {string} pdfPath - Absolute or relative path to the watermarked PDF file.
 * @returns {{ token: string, expiresAt: Date }}
 */
function create(pdfPath) {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);
  store.set(token, {
    pdfPath,
    expiresAt: expiresAt.getTime(),
    consumed: false,
  });
  return { token, expiresAt };
}

/**
 * Register an existing token with the given PDF path (e.g. when filename is token.pdf).
 * @param {string} token - Token string (e.g. used as filename).
 * @param {string} pdfPath - Path to the watermarked PDF.
 * @returns {{ token: string, expiresAt: Date }}
 */
function createWithToken(token, pdfPath) {
  const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);
  store.set(token, {
    pdfPath,
    expiresAt: expiresAt.getTime(),
    consumed: false,
  });
  return { token, expiresAt };
}

/**
 * Get token entry if valid (exists, not expired, not consumed).
 * @param {string} token
 * @returns {{ pdfPath: string } | null}
 */
function get(token) {
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.consumed) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(token);
    return null;
  }
  return { pdfPath: entry.pdfPath };
}

/**
 * Mark token as consumed (after successful download).
 * @param {string} token
 */
function consume(token) {
  const entry = store.get(token);
  if (entry) entry.consumed = true;
}

/**
 * Remove expired entries (call periodically if desired).
 */
function pruneExpired() {
  const now = Date.now();
  for (const [token, entry] of store.entries()) {
    if (now > entry.expiresAt || entry.consumed) store.delete(token);
  }
}

module.exports = {
  create,
  createWithToken,
  get,
  consume,
  pruneExpired,
};
