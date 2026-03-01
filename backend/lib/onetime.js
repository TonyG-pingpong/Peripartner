/**
 * One-time download link: register PDF path with token and return public URL.
 */

const tokenStore = require('../store/tokens');

/**
 * Register the watermarked PDF with the given token and return the public download URL.
 * @param {string} token - Token string (e.g. used as filename).
 * @param {string} pdfPath - Path to the watermarked PDF file.
 * @param {string} baseUrl - Base URL of this server (e.g. https://api.example.com).
 * @returns {{ downloadUrl: string, expiresAt: Date }}
 */
function createOneTimeLink(token, pdfPath, baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const { expiresAt } = tokenStore.createWithToken(token, pdfPath);
  const downloadUrl = `${base}/d/${token}`;
  return { downloadUrl, expiresAt };
}

module.exports = {
  createOneTimeLink,
};
