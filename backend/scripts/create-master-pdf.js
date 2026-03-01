/**
 * Creates a placeholder master PDF in backend/master/peripartner-guide.pdf.
 * Replace this file with your real guide when ready.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const OUT_DIR = path.join(__dirname, '..', 'master');
const OUT_FILE = path.join(OUT_DIR, 'peripartner-guide.pdf');

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  page.drawText('Perimenopause guide for partners', {
    x: 50,
    y: height - 80,
    size: 22,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText('Placeholder – replace this PDF with your full guide.', {
    x: 50,
    y: height - 120,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('The backend will add a watermark (buyer email) to each copy.', {
    x: 50,
    y: height - 145,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, pdfBytes);
  console.log('Created:', OUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
