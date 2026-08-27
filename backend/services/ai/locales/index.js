/**
 * Locale Registry for FarmFleet AI Fallback Engine
 * Supports 8 Indian languages: en, hi, mr, gu, ta, te, kn, pa
 */

const en = require("./en");
const hi = require("./hi");
const mr = require("./mr");
const gu = require("./gu");
const ta = require("./ta");
const te = require("./te");
const kn = require("./kn");
const pa = require("./pa");

const LOCALES = {
  en,
  hi,
  mr,
  gu,
  ta,
  te,
  kn,
  pa,
};

function getLocale(langCode) {
  if (!langCode || typeof langCode !== "string") return LOCALES.en;
  const normalized = langCode.toLowerCase().trim();
  return LOCALES[normalized] || LOCALES.en;
}

module.exports = {
  LOCALES,
  getLocale,
};
