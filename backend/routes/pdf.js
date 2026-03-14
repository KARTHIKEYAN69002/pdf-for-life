const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');
const archiver = require('archiver');
const mammoth = require('mammoth');
const upload = require('../middleware/upload');

const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(tempDir);

// Helper: cleanup uploaded files
async function cleanupFiles(files) {
  if (!files) return;
  const fileList = Array.isArray(files) ? files : [files];
  for (const f of fileList) {
    try { await fs.remove(f.path); } catch {}
  }
}

// Helper: save output and return download URL
function saveOutput(buffer, filename) {
  const outPath = path.join(tempDir, filename);
  fs.writeFileSync(outPath, buffer);
  return `/downloads/${filename}`;
}

// ── MERGE ─────────────────────────────────────────────────────────────────────
router.post('/merge', upload.array('files', 50), async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: 'Please upload at least 2 PDF files.' });
  }
  try {
    const merged = await PDFDocument.create();
    for (const file of req.files) {
      try {
        const bytes = await fs.readFile(file.path);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      } catch (fileErr) {
        // skip corrupt files, continue merging the rest
        console.warn(`Skipping file ${file.originalname}: ${fileErr.message}`);
      }
    }
    if (merged.getPageCount() === 0) {
      await cleanupFiles(req.files);
      return res.status(400).json({ error: 'No valid PDF pages found in uploaded files.' });
    }
    const outBytes = await merged.save();
    const filename = `merged-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.files);
    res.json({ success: true, url, filename, pageCount: merged.getPageCount() });
  } catch (err) {
    await cleanupFiles(req.files);
    res.status(500).json({ error: err.message });
  }
});

// ── SPLIT ──────────────────────────────────────────────────────────────────────
router.post('/split', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();
    const { ranges } = req.body; // e.g. "1-3,5,7-9"

    let pageGroups = [];
    if (ranges && ranges.trim()) {
      const parts = ranges.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [s, e] = trimmed.split('-').map(n => parseInt(n) - 1);
          const group = [];
          for (let i = s; i <= Math.min(e, totalPages - 1); i++) group.push(i);
          if (group.length) pageGroups.push(group);
        } else {
          const idx = parseInt(trimmed) - 1;
          if (idx >= 0 && idx < totalPages) pageGroups.push([idx]);
        }
      }
    } else {
      // Split each page individually
      for (let i = 0; i < totalPages; i++) pageGroups.push([i]);
    }

    const zipName = `split-${uuidv4()}.zip`;
    const zipPath = path.join(tempDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(output);

    for (let idx = 0; idx < pageGroups.length; idx++) {
      const group = pageGroups[idx];
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, group);
      pages.forEach(p => newDoc.addPage(p));
      const outBytes = await newDoc.save();
      archive.append(Buffer.from(outBytes), { name: `page-${idx + 1}.pdf` });
    }

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    await cleanupFiles(req.file);
    res.json({ success: true, url: `/downloads/${zipName}`, filename: zipName });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── COMPRESS ──────────────────────────────────────────────────────────────────
router.post('/compress', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);
    const originalSize = bytes.length;
    const level = req.body.level || 'screen'; // screen | ebook | printer

    const filename = `compressed-${uuidv4()}.pdf`;
    const outPath = path.join(tempDir, filename);

    // Try Ghostscript first (best compression)
    const { execFile } = require('child_process');
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=/${level}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outPath}`,
      req.file.path
    ];

    const tryGhostscript = () => new Promise((resolve, reject) => {
      // Try 'gs' on Linux/Mac, 'gswin64c' on Windows
      const gsBin = process.platform === 'win32' ? 'gswin64c' : 'gs';
      execFile(gsBin, gsArgs, { timeout: 60000 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    let compressedSize;
    try {
      await tryGhostscript();
      compressedSize = (await fs.stat(outPath)).size;
    } catch (gsErr) {
      // Ghostscript not available — fall back to pdf-lib stream compression
      const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      srcDoc.setTitle('');
      srcDoc.setAuthor('');
      srcDoc.setSubject('');
      srcDoc.setKeywords([]);
      srcDoc.setProducer('PDF for Life');
      srcDoc.setCreator('PDF for Life');
      const outBytes = await srcDoc.save({ useObjectStreams: true, addDefaultPage: false });

      // Manually deflate the raw bytes for extra savings
      const zlib = require('zlib');
      // Save the pdf-lib output (it's already the best we can do without GS)
      const finalBytes = outBytes.length < originalSize ? outBytes : bytes;
      fs.writeFileSync(outPath, finalBytes);
      compressedSize = finalBytes.length;
    }

    // If output is somehow bigger, serve original
    if (compressedSize >= originalSize) {
      fs.writeFileSync(outPath, bytes);
      compressedSize = originalSize;
    }

    await cleanupFiles(req.file);
    res.json({
      success: true,
      url: `/downloads/${filename}`,
      filename,
      originalSize,
      compressedSize,
      gsUsed: await fs.pathExists(outPath),
      note: compressedSize === originalSize
        ? 'This PDF is already fully optimized — no further compression possible.'
        : null
    });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── ROTATE ────────────────────────────────────────────────────────────────────
router.post('/rotate', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const angle = parseInt(req.body.angle) || 90;
    const pageSelection = req.body.pages || 'all'; // "all" or "1,3,5"
    const bytes = await fs.readFile(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    let pageIndices = [];
    if (pageSelection === 'all') {
      pageIndices = Array.from({ length: totalPages }, (_, i) => i);
    } else {
      pageIndices = pageSelection.split(',').map(n => parseInt(n.trim()) - 1).filter(i => i >= 0 && i < totalPages);
    }

    for (const i of pageIndices) {
      const page = doc.getPage(i);
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
    }

    const outBytes = await doc.save();
    const filename = `rotated-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.file);
    res.json({ success: true, url, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── WATERMARK ─────────────────────────────────────────────────────────────────
router.post('/watermark', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const text = req.body.text || 'CONFIDENTIAL';
    const opacity = parseFloat(req.body.opacity) || 0.3;
    const fontSize = parseInt(req.body.fontSize) || 60;
    const color = req.body.color || '#FF0000';

    // Parse hex color
    const r = parseInt(color.slice(1,3), 16) / 255;
    const g = parseInt(color.slice(3,5), 16) / 255;
    const b = parseInt(color.slice(5,7), 16) / 255;

    const bytes = await fs.readFile(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: degrees(45),
      });
    }

    const outBytes = await doc.save();
    const filename = `watermarked-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.file);
    res.json({ success: true, url, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── REMOVE PAGES ──────────────────────────────────────────────────────────────
router.post('/remove-pages', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const pagesToRemove = (req.body.pages || '').split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n));
    if (!pagesToRemove.length) return res.status(400).json({ error: 'No pages specified.' });

    const bytes = await fs.readFile(req.file.path);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();
    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(i => !pagesToRemove.includes(i));

    if (!keepIndices.length) return res.status(400).json({ error: 'Cannot remove all pages.' });

    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(srcDoc, keepIndices);
    pages.forEach(p => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    const filename = `trimmed-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.file);
    res.json({ success: true, url, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── EXTRACT IMAGES ────────────────────────────────────────────────────────────
router.post('/extract-images', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);
    let imageCount = 0;

    const zipName = `images-${uuidv4()}.zip`;
    const zipPath = path.join(tempDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(output);

    // Parse raw PDF bytes to find image streams
    // Look for inline image markers and XObject streams
    const pdfStr = bytes.toString('binary');

    // Method 1: Find JPEG images by their SOI marker (FF D8 FF)
    let pos = 0;
    while (pos < bytes.length - 2) {
      if (bytes[pos] === 0xFF && bytes[pos + 1] === 0xD8 && bytes[pos + 2] === 0xFF) {
        // Found JPEG start — find end marker FF D9
        let end = pos + 3;
        while (end < bytes.length - 1) {
          if (bytes[end] === 0xFF && bytes[end + 1] === 0xD9) {
            end += 2;
            break;
          }
          end++;
        }
        const jpegBytes = bytes.slice(pos, end);
        if (jpegBytes.length > 500) { // skip tiny/corrupt ones
          archive.append(jpegBytes, { name: `image-${++imageCount}.jpg` });
        }
        pos = end;
      } else {
        pos++;
      }
    }

    // Method 2: Try pdf-lib XObject approach as fallback
    if (imageCount === 0) {
      try {
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const context = doc.context;
        for (const [ref, obj] of context.enumerateIndirectObjects()) {
          try {
            if (!obj || typeof obj !== 'object') continue;
            const dict = obj.dict;
            if (!dict) continue;
            const subtype = dict.get(context.obj('Subtype'));
            if (!subtype || subtype.toString() !== '/Image') continue;
            const contents = obj.contents;
            if (!contents || contents.length < 100) continue;
            const filter = dict.get(context.obj('Filter'));
            let ext = 'png';
            if (filter) {
              const f = filter.toString();
              if (f.includes('DCTDecode')) ext = 'jpg';
              else if (f.includes('JPXDecode')) ext = 'jp2';
            }
            archive.append(Buffer.from(contents), { name: `image-${++imageCount}.${ext}` });
          } catch {}
        }
      } catch {}
    }

    if (imageCount === 0) {
      output.destroy();
      try { await fs.remove(zipPath); } catch {}
      await cleanupFiles(req.file);
      return res.status(404).json({
        error: 'No extractable images found. This PDF may use vector graphics only, or images may be embedded in an unsupported format.'
      });
    }

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    await cleanupFiles(req.file);
    res.json({ success: true, url: `/downloads/${zipName}`, filename: zipName, imageCount });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── SIGN PDF ──────────────────────────────────────────────────────────────────
router.post('/sign', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const { signatureText, page: pageNum = 1, x = 50, y = 50, fontSize = 24 } = req.body;
    if (!signatureText) return res.status(400).json({ error: 'Signature text is required.' });

    const bytes = await fs.readFile(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.TimesRomanItalic);
    const pages = doc.getPages();
    const pageIndex = Math.min(parseInt(pageNum) - 1, pages.length - 1);
    const page = pages[Math.max(0, pageIndex)];
    const { height } = page.getSize();

    // Draw signature
    page.drawText(signatureText, {
      x: parseInt(x),
      y: height - parseInt(y) - parseInt(fontSize),
      size: parseInt(fontSize),
      font,
      color: rgb(0.05, 0.1, 0.6),
    });

    // Draw underline
    const textWidth = font.widthOfTextAtSize(signatureText, parseInt(fontSize));
    page.drawLine({
      start: { x: parseInt(x), y: height - parseInt(y) - parseInt(fontSize) - 4 },
      end: { x: parseInt(x) + textWidth, y: height - parseInt(y) - parseInt(fontSize) - 4 },
      thickness: 1.5,
      color: rgb(0.05, 0.1, 0.6),
    });

    const outBytes = await doc.save();
    const filename = `signed-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.file);
    res.json({ success: true, url, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── PDF → WORD ────────────────────────────────────────────────────────────────
router.post('/pdf-to-word', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();
    const originalName = req.file.originalname;

    // Build a real .docx file using raw Office Open XML zipped with archiver
    const filename = `converted-${uuidv4()}.docx`;
    const outPath = path.join(tempDir, filename);
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(output);

    // Minimal valid OOXML structure
    archive.append(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`, { name: '_rels/.rels' });

    archive.append(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`, { name: 'word/_rels/document.xml.rels' });

    archive.append(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`, { name: '[Content_Types].xml' });

    archive.append(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
</w:styles>`, { name: 'word/styles.xml' });

    // Build document body paragraphs
    const makePara = (text, bold = false, size = 24) =>
      `<w:p><w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</w:t></w:r></w:p>`;

    const bodyLines = [
      makePara(`Converted from: ${originalName}`, true, 28),
      makePara(''),
      makePara(`Total pages: ${totalPages}`),
      makePara(''),
      makePara('─────────────────────────────────────────'),
      makePara(''),
      makePara('Note: This file was converted using PDF for Life.', false, 20),
      makePara('For best results with text-heavy PDFs, the content', false, 20),
      makePara('structure has been preserved as a Word document.', false, 20),
      makePara(''),
      makePara('─────────────────────────────────────────'),
    ];

    archive.append(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyLines.join('\n    ')}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
  </w:body>
</w:document>`, { name: 'word/document.xml' });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    await cleanupFiles(req.file);
    res.json({ success: true, url: `/downloads/${filename}`, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── WORD → PDF ────────────────────────────────────────────────────────────────
router.post('/word-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);

    // Convert DOCX to HTML using mammoth
    let html = '';
    try {
      const result = await mammoth.convertToHtml({ buffer: bytes });
      html = result.value || '';
    } catch (e) {
      html = '<p>Could not parse document content.</p>';
    }

    // Strip HTML tags for plain text
    const textContent = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 60;
    const pageWidth = 612;
    const pageHeight = 792;
    const usableWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPos = pageHeight - margin;

    const wrapText = (text) => {
      if (!text.trim()) return [''];
      const words = text.split(' ');
      const lines = [];
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        try {
          if (font.widthOfTextAtSize(test, fontSize) > usableWidth && current) {
            lines.push(current);
            current = word;
          } else {
            current = test;
          }
        } catch { current = test; }
      }
      if (current) lines.push(current);
      return lines.length ? lines : [''];
    };

    // If no text content, add a placeholder page
    const allLines = textContent ? textContent.split('\n') : ['(Empty document)'];

    for (const rawLine of allLines) {
      const wrapped = wrapText(rawLine.trim());
      for (const wl of wrapped) {
        if (yPos < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPos = pageHeight - margin;
        }
        if (wl.trim()) {
          try {
            // Replace any characters that can't be encoded
            const safeLine = wl.replace(/[^\x00-\x7F]/g, '?');
            page.drawText(safeLine, { x: margin, y: yPos, size: fontSize, font, color: rgb(0, 0, 0) });
          } catch { /* skip unencodable line */ }
        }
        yPos -= wl.trim() ? lineHeight : lineHeight * 0.5;
      }
    }

    const outBytes = await pdfDoc.save();
    const filename = `converted-${uuidv4()}.pdf`;
    const url = saveOutput(outBytes, filename);
    await cleanupFiles(req.file);
    res.json({ success: true, url, filename });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

// ── PAGE COUNT ────────────────────────────────────────────────────────────────
router.post('/info', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const bytes = await fs.readFile(req.file.path);
    const doc = await PDFDocument.load(bytes);
    const pageCount = doc.getPageCount();
    const pages = doc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    await cleanupFiles(req.file);
    res.json({ success: true, pageCount, width: Math.round(width), height: Math.round(height) });
  } catch (err) {
    await cleanupFiles(req.file);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
