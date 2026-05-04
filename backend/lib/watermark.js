/**
 * Create a watermarked PDF: visible text at top of each page + invisible metadata.
 */

const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const WATERMARK_FONT_SIZE = 11;
const WATERMARK_OPACITY = 0.75;
const TOP_MARGIN = 24;
const SIDE_MARGIN = 24;
const COPYRIGHT_FONT_SIZE = 8;
const COPYRIGHT_OPACITY = 0.65;
const LINE_SPACING = 6;

/**
 * Build the visible watermark string (personal-use license line with email and/or name).
 * @param {{ email: string, name?: string }} buyer
 * @returns {string}
 */
function watermarkText(buyer) {
  const { email, name } = buyer;
  if (name && name.length > 0) {
    return `This document is licensed for personal use only to ${name} (${email})`;
  }
  return `This document is licensed for personal use only to ${email}`;
}

/**
 * Load master PDF, add visible watermark at top of each page and invisible (metadata), write to output path.
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
  const copyrightYear = new Date().getFullYear();
  const copyrightLine = `© ${copyrightYear} Peripartner. All rights reserved.`;

  for (const page of pages) {
    const { width, height } = page.getSize();
    // Position at top of page (pdf-lib origin is bottom-left; y grows upward)
    const mainY = height - TOP_MARGIN;
    const copyrightY = mainY - WATERMARK_FONT_SIZE - LINE_SPACING;

    // Main watermark: licensed to buyer (more visible)
    page.drawText(text, {
      x: SIDE_MARGIN,
      y: mainY,
      size: WATERMARK_FONT_SIZE,
      font,
      color: rgb(0.15, 0.15, 0.15),
      opacity: WATERMARK_OPACITY,
    });

    // Copyright notice (small print at top)
    page.drawText(copyrightLine, {
      x: SIDE_MARGIN,
      y: copyrightY,
      size: COPYRIGHT_FONT_SIZE,
      font,
      color: rgb(0.25, 0.25, 0.25),
      opacity: COPYRIGHT_OPACITY,
    });
  }

  // Invisible watermark: buyer email (and name) in PDF metadata
  doc.setTitle('Perimenopause guide for partners');
  doc.setAuthor(buyer.email);
  doc.setSubject(
    buyer.name
      ? `Personal use only — ${buyer.name} (${buyer.email})`
      : `Personal use only — ${buyer.email}`,
  );
  doc.setKeywords([buyer.email, 'peripartner', 'perimenopause']);

  const pdfBytes = await doc.save();
  await fs.writeFile(outputPath, pdfBytes);
}

module.exports = {
  createWatermarkedPdf,
  watermarkText,
};
