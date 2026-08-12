'use strict';

const fs = require('fs');
const path = require('path');

const LOCAL_FONT_DIR = path.join(__dirname, '..', '..', 'assets', 'fonts');

// Map of supported language codes to Noto Sans TTF files
const FONT_MAP = {
  hi: { name: 'NotoDevanagari', file: 'NotoSansDevanagari-Regular.ttf' },
  mr: { name: 'NotoDevanagari', file: 'NotoSansDevanagari-Regular.ttf' },
  gu: { name: 'NotoGujarati', file: 'NotoSansGujarati-Regular.ttf' },
  ta: { name: 'NotoTamil', file: 'NotoSansTamil-Regular.ttf' },
  te: { name: 'NotoTelugu', file: 'NotoSansTelugu-Regular.ttf' },
  kn: { name: 'NotoKannada', file: 'NotoSansKannada-Regular.ttf' },
  pa: { name: 'NotoGurmukhi', file: 'NotoSansGurmukhi-Regular.ttf' },
};

/**
 * Registers all available Unicode TTF fonts onto a PDFKit document instance.
 * @param {Object} doc - PDFDocument instance
 */
function registerAllFonts(doc) {
  if (!doc._fontFamilies) {
    doc._fontFamilies = {};
  }

  for (const [lang, info] of Object.entries(FONT_MAP)) {
    if (!doc._fontFamilies[info.name]) {
      const fontPath = path.join(LOCAL_FONT_DIR, info.file);
      if (fs.existsSync(fontPath)) {
        try {
          doc.registerFont(info.name, fontPath);
          // Also register Devanagari alias for backward compatibility
          if (info.name === 'NotoDevanagari' && !doc._fontFamilies['Devanagari']) {
            doc.registerFont('Devanagari', fontPath);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[pdfFontHelper] Failed to register font ${info.name}:`, err.message);
        }
      }
    }
  }
}

/**
 * Legacy method for Devanagari font registration
 */
function registerDevanagariFont(doc) {
  registerAllFonts(doc);
  return doc._fontFamilies && (doc._fontFamilies['NotoDevanagari'] ? 'NotoDevanagari' : doc._fontFamilies['Devanagari'] ? 'Devanagari' : null);
}

/**
 * Resolves the proper font name for a given language code and weight.
 * @param {Object} doc - PDFDocument instance
 * @param {string} [langCode='en']
 * @param {boolean} [isBold=false]
 * @returns {string}
 */
function getFontForLanguage(doc, langCode = 'en', isBold = false) {
  registerAllFonts(doc);

  const lang = String(langCode || 'en').toLowerCase().split('-')[0];
  const info = FONT_MAP[lang];

  if (info && doc._fontFamilies && doc._fontFamilies[info.name]) {
    return info.name;
  }

  return isBold ? 'Helvetica-Bold' : 'Helvetica';
}

module.exports = {
  registerAllFonts,
  registerDevanagariFont,
  getFontForLanguage,
};

