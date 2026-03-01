/**
 * Create a watermarked PDF: visible text on each page + invisible metadata.
 */

const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const WATERMARK_FONT_SIZE = 9;
const WATERMARK_MARGIN = 20;
const WATERMARK_OPACITY = 0.4;

/**
 * Build the visible watermark string (e.g. "Licensed to name (email)" or "Licensed to email").
 * @param {{ email: string, name?: string }} buyer
 * @returns {string}
 */
function watermarkText(buyer) {
  const { email, name } = buyer;
  if (name && name.length > 0) {
    return `Licensed to ${name} (${email})`;
  }
  return `Licensed to ${email}`;
}

/**
 * Load master PDF, add visible watermark on each page and invisible (metadata), write to output path.
 * @param {string} masterPdfPath - Path to the master PDF file.
 * @param {string} outputPath - Path to write the watermarked PDF.
 * @param {{ email: string, name?: string }} buyer - Buyer email and optional name.
 */
async function createWatermarkedPdf(masterPdfPath, outputPath, buyer) {
  const bytes = await fs.readFile(masterPdfPath);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const text = watermarkText(buyer);

  for (const page of pages) {
    const x = WATERMARK_MARGIN;
    const y = WATERMARK_MARGIN;
    page.drawText(text, {
      x,
      y,
      size: WATERMARK_FONT_SIZE,
      font,
      color: rgb(0.3, 0.3, 0.3),
      opacity: WATERMARK_OPACITY,
    });
  }

  // Invisible watermark: buyer email (and name) in PDF metadata
  doc.setTitle('Perimenopause guide for partners');
  doc.setAuthor(buyer.email);
  doc.setSubject(buyer.name ? `Licensed to ${buyer.name}` : 'Licensed download');
  doc.setKeywords([buyer.email, 'peripartner', 'perimenopause']);

  const pdfBytes = await doc.save();
  await fs.writeFile(outputPath, pdfBytes);
}

module.exports = {
  createWatermarkedPdf,
  watermarkText,
};
