'use strict';

const { getFontForLanguage, registerAllFonts } = require('./pdfFontHelper');

/* ============================================================================
 * DESIGN TOKENS
 * ========================================================================== */

const COLORS = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  light: '#E8F5E9',
  grey: '#ECEFF1',
  dark: '#263238',
  white: '#FFFFFF',
  border: '#CFD8DC',
  muted: '#607D8B',

  // Badge / status colors
  badgeUpcoming: '#2E7D32',
  badgeUpcomingBg: '#E8F5E9',
  badgeDelayed: '#E65100',
  badgeDelayedBg: '#FFF3E0',
  badgeCompleted: '#1565C0',
  badgeCompletedBg: '#E3F2FD',
  badgeDefault: '#455A64',
  badgeDefaultBg: '#ECEFF1'
};

const FONT = {
  bold: 'Helvetica-Bold',
  regular: 'Helvetica'
};

const PDF_I18N = {
  en: {
    coverTitle: "Crop Cultivation Advisory Report",
    tagline: "AI-Powered Smart Farming Plan",
    farmInfo: "Farm & Crop Information",
    timeline: "Cultivation Timeline",
    equipment: "Equipment Requirements",
    labour: "Labour Requirements",
    fertilizer: "Fertilizer Schedule",
    irrigation: "Irrigation Schedule",
    weather: "Weather Advisory & Risk Snapshot",
    precautions: "Precautions & Cultivation Tips",
    reportId: "Report ID",
    generatedDate: "Generated Date",
  },
  hi: {
    coverTitle: "फसल खेती सलाह रिपोर्ट",
    tagline: "एआई-संचालित स्मार्ट खेती योजना",
    farmInfo: "किसान एवं खेत का विवरण",
    timeline: "खेती की समयरेखा",
    equipment: "आवश्यक उपकरण",
    labour: "आवश्यक मजदूर",
    fertilizer: "उर्वरक अनुसूची",
    irrigation: "सिंचाई अनुसूची",
    weather: "मौसम सलाह एवं जोखिम विश्लेषण",
    precautions: "सावधानियां एवं खेती की युक्तियां",
    reportId: "रिपोर्ट आईडी",
    generatedDate: "जारी करने की तिथि",
  },
  mr: {
    coverTitle: "पीक लागवड सल्लागार अहवाल",
    tagline: "एआय-चलित स्मार्ट शेती आराखडा",
    farmInfo: "शेतकरी व शेताचा तपशील",
    timeline: "शेतीची कालमर्यादा",
    equipment: "आवश्यक उपकरणे",
    labour: "आवश्यक मजूर",
    fertilizer: "खत व्यवस्थापन वेळापत्रक",
    irrigation: "सिंचन वेळापत्रक",
    weather: "हवामान सल्ला व धोका विश्लेषण",
    precautions: "महत्त्वाच्या खबरदाऱ्या व शेती टिप्स",
    reportId: "अहवाल आयडी",
    generatedDate: "निर्मिती तारीख",
  },
  gu: {
    coverTitle: "પાક ખેતી સલાહ રિપોર્ટ",
    tagline: "એઆઈ-સંચાલિત સ્માર્ટ ખેતી યોજના",
    farmInfo: "ખેડૂત અને જમીનની વિગત",
    timeline: "ખેતીની સમયરેખા",
    equipment: "જરૂરી સાધનો",
    labour: "જરૂરી મજૂરો",
    fertilizer: "ખાતર સમયપત્રક",
    irrigation: "સિંચાઈ સમયપત્રક",
    weather: "હવામાન સલાહ અને જોખમ વિશ્લેષણ",
    precautions: "મહત્વપૂર્ણ સાવચેતીઓ અને ટિપ્સ",
    reportId: "રિપોર્ટ આઈડી",
    generatedDate: "તૈયાર કર્યાની તારીખ",
  },
  ta: {
    coverTitle: "பயிர் சாகுபடி ஆலோசனை அறிக்கை",
    tagline: "AI அடிப்படையிலான ஸ்மார்ட் விவசாய திட்டம்",
    farmInfo: "விவசாயி மற்றும் நில விவரங்கள்",
    timeline: "சாகுபடி காலக்கெடு",
    equipment: "தேவையான உபகரணங்கள்",
    labour: "தேவையான தொழிலாளர்கள்",
    fertilizer: "உரமிடுதல் அட்டவணை",
    irrigation: "நீர்ப்பாசன அட்டவணை",
    weather: "வானிலை ஆலோசனை & அபாய விவரம்",
    precautions: "முக்கிய முன்னெச்சரிக்கைகள் & குறிப்புகள்",
    reportId: "அறிக்கை எண்",
    generatedDate: "உருவாக்கப்பட்ட தேதி",
  },
  te: {
    coverTitle: "పంట సాగు సలహా నివేదిక",
    tagline: "AI-ఆధారిత స్మార్ట్ వ్యవసాయ ప్రణాళిక",
    farmInfo: "రైతు & పొలం వివరాలు",
    timeline: "సాగు సమయపట్టిక",
    equipment: "కావాల్సిన పరికరాలు",
    labour: "కావాల్సిన కూలీలు",
    fertilizer: "ఎరువుల పట్టిక",
    irrigation: "నీటి పారుదల పట్టిక",
    weather: "వాతావరణ సూచన & ప్రమాద నివేదిక",
    precautions: "ముఖ్యమైన జాగ్రత్తలు & సూచనలు",
    reportId: "నివేదిక ఐడీ",
    generatedDate: "తయారుచేసిన తేదీ",
  },
  kn: {
    coverTitle: "ಬೆಳೆ ಬೇಸಾಯ ಸಲಹಾ ವರದಿ",
    tagline: "AI-ಆಧಾರಿತ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಯೋಜನೆ",
    farmInfo: "ರೈತ ಮತ್ತು ಜಮೀನಿನ ವಿವರಗಳು",
    timeline: "ಬೇಸಾಯದ ವೇಳಾಪಟ್ಟಿ",
    equipment: "ಅಗತ್ಯವಿರುವ ಉಪಕರಣಗಳು",
    labour: "ಅಗತ್ಯವಿರುವ ಕಾರ್ಮಿಕರು",
    fertilizer: "ಗೊಬ್ಬರ ವೇಳಾಪಟ್ಟಿ",
    irrigation: "ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ",
    weather: "ಹವಾಮಾನ ಸಲಹೆ & ಅಪಾಯದ ವಿವರ",
    precautions: "ಮುಖ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು & ಸಲಹೆಗಳು",
    reportId: "ವರದಿ ಐಡಿ",
    generatedDate: "ತಯಾರಿಸಿದ ದಿನಾಂಕ",
  },
  pa: {
    coverTitle: "ਫਸਲ ਖੇਤੀ ਸਲਾਹਕਾਰੀ ਰਿਪੋਰਟ",
    tagline: "ਏਆਈ-ਸੰਚਾਲਿਤ ਸਮਾਰਟ ਖੇਤੀ ਯੋਜਨਾ",
    farmInfo: "ਕਿਸਾਨ ਅਤੇ ਜ਼ਮੀਨ ਦੇ ਵੇਰਵੇ",
    timeline: "ਖੇਤੀ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ",
    equipment: "ਲੋੜੀਂਦੇ ਉਪਕਰਣ",
    labour: "ਲੋੜੀਂਦੇ ਮਜ਼ਦੂਰ",
    fertilizer: "ਖਾਦ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ",
    irrigation: "ਸਿੰਚਾਈ ਦੀ ਸਮਾਂ-ਸਾਰਣੀ",
    weather: "ਮੌਸਮ ਸਲਾਹ ਅਤੇ ਖਤਰੇ ਦਾ ਵੇਰਵਾ",
    precautions: "ਜ਼ਰੂਰੀ ਸਾਵਧਾਨੀਆਂ ਅਤੇ ਟਿਪਸ",
    reportId: "ਰਿਪੋਰਟ ਆਈਡੀ",
    generatedDate: "ਤਿਆਰ ਕਰਨ ਦੀ ਮਿਤੀ",
  },
};

function pdfT(report, key) {
  const lang = (report && report.language && PDF_I18N[report.language]) ? report.language : 'en';
  return PDF_I18N[lang][key] || PDF_I18N.en[key] || key;
}

function getFont(doc, isBold = false) {
  const lang = doc._currentLanguage || 'en';
  return getFontForLanguage(doc, lang, isBold);
}

const LAYOUT = {
  headerHeight: 78,
  footerHeight: 46,
  cardGap: 12,
  sectionGap: 18
};

/* ============================================================================
 * LOW-LEVEL GEOMETRY HELPERS
 * ========================================================================== */

/** Returns the left x-coordinate of the printable content area. */
function contentX(doc) {
  return doc.page.margins.left;
}

/** Returns the printable content width for the current page. */
function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/** Returns the y-coordinate at which body content should start (below header). */
function contentTop(doc) {
  return doc.page.margins.top + LAYOUT.headerHeight;
}

/** Returns the y-coordinate at which body content must stop (above footer). */
function contentBottom(doc) {
  return doc.page.height - doc.page.margins.bottom - LAYOUT.footerHeight;
}

/**
 * Safely reads a nested value from the report object.
 * Returns `fallback` if the path does not resolve to a usable value.
 */
function safe(value, fallback = 'Not available') {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value) && value.length === 0) return fallback;
  return value;
}

/** Formats a date-like value coming from the report into a readable string. */
function formatDate(value) {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Ensures there is enough vertical space left on the page for the next
 * block of content. If not, starts a new page and redraws the standard
 * header/footer chrome, then resets doc.y to the content start position.
 */
function checkPageBreak(doc, report, requiredHeight, options = {}) {
  const limit = contentBottom(doc);
  if (doc.y + requiredHeight > limit) {
    doc.addPage();
    drawHeader(doc, report);
    drawFooter(doc, report);
    doc.y = contentTop(doc);
    if (options.repeatTitle) {
      drawSectionTitle(doc, options.repeatTitle, { continued: true });
    }
  }
}

/* ============================================================================
 * CHROME: HEADER / FOOTER / DIVIDERS
 * ========================================================================== */

/**
 * Draws the FarmFleet AI logo mark (a simple vector leaf/circle emblem -
 * no external image asset required).
 */
function drawLogoMark(doc, x, y, size = 30) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  doc.save();
  doc.circle(cx, cy, r).fill(COLORS.primary);

  // Stylised leaf mark using two overlapping curves
  doc.save();
  doc.fillColor(COLORS.white);
  doc.moveTo(cx, cy + r * 0.55)
    .quadraticCurveTo(cx - r * 0.55, cy + r * 0.1, cx, cy - r * 0.55)
    .quadraticCurveTo(cx + r * 0.55, cy + r * 0.1, cx, cy + r * 0.55)
    .fill();
  doc.restore();

  doc.restore();
}

/**
 * Standard page header used on every content page (pages 2 and onward).
 * Draws logo + brand name + tagline + divider line.
 */
function drawHeader(doc, report) {
  const x = contentX(doc);
  const y = doc.page.margins.top;
  const w = contentWidth(doc);

  drawLogoMark(doc, x, y, 28);

  doc.font(FONT.bold).fontSize(15).fillColor(COLORS.dark)
    .text('FarmFleet AI', x + 38, y + 1, { lineBreak: false });

  doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
    .text('AI Powered Smart Farming', x + 38, y + 19, { lineBreak: false });

  // Report ID on the right, small and unobtrusive
  const reportId = safe(report && report.reportId, '');
  if (reportId !== 'Not available' && reportId !== '') {
    doc.font(FONT.regular).fontSize(8).fillColor(COLORS.muted)
      .text(`Report ID: ${reportId}`, x, y + 6, { width: w, align: 'right' });
  }

  drawDivider(doc, x, y + 42, w, COLORS.border);
}

/**
 * Standard page footer used on every page.
 * Fixed to the bottom margin area; does not disturb the content cursor.
 */
function drawFooter(doc, report) {
  const x = contentX(doc);
  const w = contentWidth(doc);
  const footerTop = doc.page.height - doc.page.margins.bottom - LAYOUT.footerHeight + 8;

  drawDivider(doc, x, footerTop, w, COLORS.border);

  doc._ffPageCount = (doc._ffPageCount || 0) + 1;
  const pageNumber = doc._ffPageCount;

  doc.font(FONT.regular).fontSize(8).fillColor(COLORS.muted)
    .text('Generated by FarmFleet AI  |  AI Powered Agriculture Platform  |  www.farmfleet.ai',
      x, footerTop + 10, { width: w * 0.7, lineBreak: false });

  doc.font(FONT.regular).fontSize(8).fillColor(COLORS.muted)
    .text(`Page ${pageNumber}`, x, footerTop + 10, { width: w, align: 'right', lineBreak: false });
}

/** Draws a thin horizontal divider line. */
function drawDivider(doc, x, y, width, color = COLORS.border) {
  doc.save();
  doc.strokeColor(color).lineWidth(1);
  doc.moveTo(x, y).lineTo(x + width, y).stroke();
  doc.restore();
}

/**
 * Draws a section title with a small green accent bar to its left.
 * Set options.continued = true to render a lighter "(continued)" suffix
 * when a section spills onto a following page.
 */
function drawSectionTitle(doc, title, options = {}) {
  const x = contentX(doc);
  const w = contentWidth(doc);

  checkPageBreak(doc, options.report, 34);

  const y = doc.y;
  doc.rect(x, y + 2, 4, 16).fill(COLORS.primary);

  const label = options.continued ? `${title} (continued)` : title;
  doc.font(FONT.bold).fontSize(14).fillColor(COLORS.dark)
    .text(label, x + 12, y, { width: w - 12 });

  doc.y = y + 26;

  if (options.subtitle) {
    doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.muted)
      .text(options.subtitle, x + 12, doc.y, { width: w - 12 });
    doc.moveDown(0.4);
  }

  doc.y += 6;
}

/* ============================================================================
 * CARDS
 * ========================================================================== */

/**
 * Draws a generic bordered info card with a green title strip and a label /
 * value body. Returns the height consumed.
 */
function drawInfoCard(doc, x, y, width, label, value, options = {}) {
  const padding = 10;
  const stripHeight = 20;
  const valueText = String(safe(value));

  doc.font(FONT.regular).fontSize(10);
  const valueHeight = doc.heightOfString(valueText, { width: width - padding * 2 });
  const height = stripHeight + padding + valueHeight + padding;

  // Card border + background
  doc.save();
  doc.roundedRect(x, y, width, height, 6).fillAndStroke(COLORS.white, COLORS.border);
  doc.restore();

  // Green title strip
  doc.save();
  doc.roundedRect(x, y, width, stripHeight, 6).fill(COLORS.light);
  doc.rect(x, y + stripHeight - 6, width, 6).fill(COLORS.light);
  doc.restore();

  doc.font(FONT.bold).fontSize(9).fillColor(COLORS.primary)
    .text(label.toUpperCase(), x + padding, y + 5, { width: width - padding * 2, lineBreak: false });

  doc.font(FONT.bold).fontSize(11).fillColor(COLORS.dark)
    .text(valueText, x + padding, y + stripHeight + 6, { width: width - padding * 2 });

  return height;
}

/**
 * Draws a metric card (used heavily on the Executive Summary page):
 * a compact card with a big bold value and a small caption underneath.
 */
function drawMetricCard(doc, x, y, width, height, label, value, options = {}) {
  const accent = options.accent || COLORS.primary;

  doc.save();
  doc.roundedRect(x, y, width, height, 8).fillAndStroke(COLORS.white, COLORS.border);
  doc.restore();

  doc.save();
  doc.roundedRect(x, y, 5, height, 2).fill(accent);
  doc.restore();

  doc.font(FONT.regular).fontSize(9).fillColor(COLORS.muted)
    .text(label.toUpperCase(), x + 16, y + 12, { width: width - 28 });

  doc.font(FONT.bold).fontSize(15).fillColor(COLORS.dark)
    .text(String(safe(value)), x + 16, y + 30, { width: width - 28 });

  if (options.caption) {
    doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
      .text(options.caption, x + 16, y + height - 20, { width: width - 28, lineBreak: false });
  }
}

/**
 * Draws a weather summary card (grid of weather metrics). Used on the
 * Weather page and, in compact form, on the Executive Summary page.
 */
function drawWeatherCard(doc, x, y, width, weather = {}) {
  const rowHeight = 46;
  const tempVal = weather.temperature !== undefined && weather.temperature !== null ? `${weather.temperature}°C` : '28°C';
  const humVal = weather.humidity !== undefined && weather.humidity !== null ? `${weather.humidity}%` : '65%';
  const windVal = weather.windSpeed !== undefined && weather.windSpeed !== null ? `${weather.windSpeed} km/h` : '10 km/h';
  const rainVal = weather.rainProbability !== undefined && weather.rainProbability !== null ? `${weather.rainProbability}%` : '15%';

  const cols = [
    { label: 'Temperature', value: tempVal },
    { label: 'Humidity', value: humVal },
    { label: 'Wind Speed', value: windVal },
    { label: 'Rain Probability', value: rainVal }
  ];

  const colWidth = width / cols.length;

  doc.save();
  doc.roundedRect(x, y, width, rowHeight + 34, 8).fillAndStroke(COLORS.light, COLORS.border);
  doc.restore();

  doc.font(FONT.bold).fontSize(11).fillColor(COLORS.dark)
    .text(`Condition: ${safe(weather.condition, 'Sunny / Clear')}`, x + 14, y + 10, { width: width - 28, lineBreak: false });

  cols.forEach((col, i) => {
    const cx = x + i * colWidth;
    doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
      .text(col.label.toUpperCase(), cx + 14, y + 34, { width: colWidth - 20 });
    doc.font(FONT.bold).fontSize(12).fillColor(COLORS.primary)
      .text(String(col.value), cx + 14, y + 48, { width: colWidth - 20, lineBreak: false });
  });

  return rowHeight + 34;
}

/**
 * Draws the "Continue on FarmFleet" login card that replaces the QR-code
 * pattern used on the final page of the report.
 */
function drawLoginCard(doc, x, y, width, report) {
  const padding = 16;
  const benefits = [
    'Live Weather Updates',
    'AI Recommendations',
    'Updated Farming Schedule',
    'Equipment Booking',
    'Labour Hiring'
  ];

  doc.font(FONT.regular).fontSize(9.5);
  const benefitsHeight = benefits.length * 15;
  const height = 34 + benefitsHeight + 46;

  doc.save();
  doc.roundedRect(x, y, width, height, 8).fillAndStroke(COLORS.light, COLORS.primary);
  doc.restore();

  doc.font(FONT.bold).fontSize(13).fillColor(COLORS.primary)
    .text('Continue on FarmFleet', x + padding, y + 14, { width: width - padding * 2 });

  doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.dark)
    .text('To receive:', x + padding, y + 36, { width: width - padding * 2 });

  let by = y + 52;
  benefits.forEach((b) => {
    drawBullet(doc, x + padding, by, width - padding * 2, b);
    by += 15;
  });

  const loginUrl = safe(report && report.loginUrl, 'https://farmfleet.ai/login');

  doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.dark)
    .text('Login at:', x + padding, by + 8, { width: width - padding * 2 });

  doc.font(FONT.bold).fontSize(10.5).fillColor(COLORS.primary)
    .text(loginUrl, x + padding, by + 22, { width: width - padding * 2, lineBreak: false });

  return height;
}

/* ============================================================================
 * BADGES
 * ========================================================================== */

/**
 * Draws a small rounded status badge (Upcoming / Delayed / Completed).
 * Returns the badge width so callers can lay out surrounding content.
 */
function drawBadge(doc, status, x, y) {
  const normalized = String(status || '').trim().toLowerCase();

  let bg = COLORS.badgeDefaultBg;
  let fg = COLORS.badgeDefault;
  let label = safe(status, 'Unknown');

  if (normalized === 'upcoming') {
    bg = COLORS.badgeUpcomingBg; fg = COLORS.badgeUpcoming; label = 'Upcoming';
  } else if (normalized === 'delayed') {
    bg = COLORS.badgeDelayedBg; fg = COLORS.badgeDelayed; label = 'Delayed';
  } else if (normalized === 'completed') {
    bg = COLORS.badgeCompletedBg; fg = COLORS.badgeCompleted; label = 'Completed';
  }

  doc.font(FONT.bold).fontSize(8);
  const textWidth = doc.widthOfString(label);
  const badgeWidth = textWidth + 18;
  const badgeHeight = 16;

  doc.save();
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 8).fill(bg);
  doc.restore();

  doc.font(FONT.bold).fontSize(8).fillColor(fg)
    .text(label, x + 9, y + 4, { lineBreak: false });

  return badgeWidth;
}

/* ============================================================================
 * BULLET LISTS
 * ========================================================================== */

function drawBullet(doc, x, y, width, text) {
  doc.save();
  doc.circle(x + 3, y + 5, 2).fill(COLORS.primary);
  doc.restore();

  doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.dark)
    .text(String(text), x + 12, y, { width: width - 12 });
}

/**
 * Draws a bullet list, automatically breaking the page between items
 * if space runs out.
 */
function drawBulletList(doc, items, options = {}) {
  const x = contentX(doc) + (options.indent || 0);
  const w = contentWidth(doc) - (options.indent || 0);
  const list = Array.isArray(items) && items.length > 0 ? items : ['Not available'];

  list.forEach((item) => {
    doc.font(FONT.regular).fontSize(9.5);
    const text = String(item);
    const height = doc.heightOfString(text, { width: w - 12 }) + 8;

    checkPageBreak(doc, options.report, height, options.repeatTitle ? { repeatTitle: options.repeatTitle } : {});

    drawBullet(doc, x, doc.y, w, text);
    doc.y += Math.max(height, 15);
  });
}

/* ============================================================================
 * TABLES
 * ========================================================================== */

/**
 * Draws a styled table with a solid header row and alternating row
 * background colors. Long cell text wraps automatically, and the table
 * flows across pages, repeating the header row on each new page.
 */
function drawTable(doc, { headers, rows, columnWidths, report, title }) {
  const x = contentX(doc);
  const w = contentWidth(doc);
  const widths = columnWidths && columnWidths.length === headers.length
    ? columnWidths
    : headers.map(() => w / headers.length);

  const headerHeight = 24;
  const cellPadding = 6;

  function drawTableHeader() {
    checkPageBreak(doc, report, headerHeight + 20, title ? { repeatTitle: title } : {});
    const y = doc.y;
    doc.save();
    doc.roundedRect(x, y, w, headerHeight, 6).fill(COLORS.primary);
    doc.restore();

    let cx = x;
    headers.forEach((h, i) => {
      doc.font(FONT.bold).fontSize(9).fillColor(COLORS.white)
        .text(String(h), cx + cellPadding, y + 7, { width: widths[i] - cellPadding * 2, lineBreak: false });
      cx += widths[i];
    });

    doc.y = y + headerHeight;
  }

  drawTableHeader();

  rows.forEach((row, rowIndex) => {
    doc.font(FONT.regular).fontSize(9);
    const cellHeights = row.map((cell, i) =>
      doc.heightOfString(String(safe(cell, '-')), { width: widths[i] - cellPadding * 2 })
    );
    const rowHeight = Math.max(...cellHeights, 12) + cellPadding * 2;

    if (doc.y + rowHeight > contentBottom(doc)) {
      doc.addPage();
      drawHeader(doc, report);
      drawFooter(doc, report);
      doc.y = contentTop(doc);
      if (title) drawSectionTitle(doc, title, { continued: true });
      drawTableHeader();
    }

    const y = doc.y;
    const bg = rowIndex % 2 === 0 ? COLORS.white : COLORS.grey;
    doc.save();
    doc.rect(x, y, w, rowHeight).fill(bg);
    doc.restore();

    let cx = x;
    row.forEach((cell, i) => {
      doc.font(FONT.regular).fontSize(9).fillColor(COLORS.dark)
        .text(String(safe(cell, '-')), cx + cellPadding, y + cellPadding, { width: widths[i] - cellPadding * 2 });
      cx += widths[i];
    });

    doc.save();
    doc.strokeColor(COLORS.border).lineWidth(0.5);
    doc.moveTo(x, y + rowHeight).lineTo(x + w, y + rowHeight).stroke();
    doc.restore();

    doc.y = y + rowHeight;
  });

  doc.y += LAYOUT.sectionGap;
}

/* ============================================================================
 * TIMELINE CARD
 * ========================================================================== */

/**
 * Draws a single vertical-timeline entry: a connector dot/line on the left
 * and a card on the right containing week, title, description, date and
 * status badge.
 */
function drawTimelineCard(doc, item, options = {}) {
  const x = contentX(doc);
  const w = contentWidth(doc);
  const railX = x + 6;
  const cardX = x + 24;
  const cardW = w - 24;
  const padding = 10;

  const title = safe(item.title, 'Untitled Task');
  const description = safe(item.description, '');
  const week = safe(item.week, '-');
  const date = formatDate(item.scheduledDate);
  const status = safe(item.status, 'Upcoming');

  doc.font(FONT.regular).fontSize(9.5);
  const descHeight = description !== 'Not available'
    ? doc.heightOfString(description, { width: cardW - padding * 2 })
    : 0;

  const height = 30 + descHeight + 22 + padding;

  checkPageBreak(doc, options.report, height + 10, options.repeatTitle ? { repeatTitle: options.repeatTitle } : {});
  const y = doc.y;

  // Rail dot + connecting line
  doc.save();
  doc.circle(railX, y + 12, 4).fill(COLORS.primary);
  doc.strokeColor(COLORS.border).lineWidth(1.5);
  doc.moveTo(railX, y + 16).lineTo(railX, y + height).stroke();
  doc.restore();

  // Card
  doc.save();
  doc.roundedRect(cardX, y, cardW, height, 6).fillAndStroke(COLORS.white, COLORS.border);
  doc.restore();

  doc.font(FONT.bold).fontSize(9).fillColor(COLORS.primary)
    .text(`WEEK ${week}`, cardX + padding, y + 10, { width: cardW - padding * 2 - 90, lineBreak: false });

  doc.font(FONT.bold).fontSize(11.5).fillColor(COLORS.dark)
    .text(title, cardX + padding, y + 22, { width: cardW - padding * 2 - 90 });

  drawBadge(doc, status, cardX + cardW - padding - 74, y + 10);

  if (description !== 'Not available') {
    doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.muted)
      .text(description, cardX + padding, y + 38, { width: cardW - padding * 2 });
  }

  doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
    .text(`Scheduled: ${date}`, cardX + padding, y + height - 16, { width: cardW - padding * 2, lineBreak: false });

  doc.y = y + height + 14;
}

/* ============================================================================
 * PAGE 1 — COVER PAGE
 * ========================================================================== */

function drawCoverPage(doc, report) {
  const x = contentX(doc);
  const w = contentWidth(doc);
  const top = doc.page.margins.top;

  drawFooter(doc, report);

  // Hero brand block
  drawLogoMark(doc, x, top, 46);
  doc.font(FONT.bold).fontSize(22).fillColor(COLORS.dark)
    .text('FarmFleet AI', x + 58, top + 6, { lineBreak: false });
  doc.font(FONT.regular).fontSize(11).fillColor(COLORS.muted)
    .text('AI Powered Smart Farming', x + 58, top + 30, { lineBreak: false });

  drawDivider(doc, x, top + 70, w, COLORS.border);

  // Title block
  let y = top + 100;
  doc.font(FONT.bold).fontSize(11).fillColor(COLORS.primary)
    .text('AI SMART FARMING REPORT', x, y, { width: w, align: 'center' });

  y += 26;
  const cropName = safe(report && report.crop);
  doc.font(FONT.bold).fontSize(28).fillColor(COLORS.dark)
    .text(String(cropName), x, y, { width: w, align: 'center' });

  y += 52;

  // Decorative accent band
  doc.save();
  doc.roundedRect(x, y, w, 90, 10).fill(COLORS.light);
  doc.restore();

  const farmerName = safe(report && report.farmer && report.farmer.name);
  const district = safe(report && report.location && report.location.district);
  const state = safe(report && report.location && report.location.state);

  doc.font(FONT.regular).fontSize(9).fillColor(COLORS.muted)
    .text('PREPARED FOR', x, y + 16, { width: w, align: 'center' });
  doc.font(FONT.bold).fontSize(16).fillColor(COLORS.dark)
    .text(String(farmerName), x, y + 30, { width: w, align: 'center' });
  doc.font(FONT.regular).fontSize(10.5).fillColor(COLORS.dark)
    .text(`${district}, ${state}`, x, y + 54, { width: w, align: 'center' });

  y += 90 + 24;

  // Key facts grid: Land Area / Generated Date / Report ID
  const landArea = safe(report && report.landArea);
  const generatedDate = formatDate(report && report.generatedDate);
  const reportId = safe(report && report.reportId);

  const colWidth = w / 3;
  const facts = [
    { label: 'LAND AREA', value: landArea },
    { label: 'GENERATED ON', value: generatedDate },
    { label: 'REPORT ID', value: reportId }
  ];

  facts.forEach((f, i) => {
    const fx = x + i * colWidth;
    doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
      .text(f.label, fx, y, { width: colWidth, align: 'center' });
    doc.font(FONT.bold).fontSize(11.5).fillColor(COLORS.dark)
      .text(String(f.value), fx, y + 13, { width: colWidth, align: 'center', lineBreak: false });
  });

  y += 50;
  drawDivider(doc, x, y, w, COLORS.border);
  y += 20;

  // Login call-to-action strip
  const loginUrl = safe(report && report.loginUrl, 'https://farmfleet.ai/login');
  doc.save();
  doc.roundedRect(x, y, w, 50, 8).fillAndStroke(COLORS.light, COLORS.primary);
  doc.restore();

  doc.font(FONT.regular).fontSize(9).fillColor(COLORS.dark)
    .text('Track live updates and AI recommendations at', x + 16, y + 10, { width: w - 32 });
  doc.font(FONT.bold).fontSize(9.5).fillColor(COLORS.primary)
    .text(loginUrl, x + 16, y + 26, { width: w - 32 });

  doc.y = y + 66;
}

/* ============================================================================
 * PAGE 2 — EXECUTIVE SUMMARY
 * ========================================================================== */

function drawExecutiveSummary(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Executive Summary', {
    subtitle: 'A quick 30-second overview of your farming plan',
    report
  });

  const summary = (report && report.summary) || {};
  const x = contentX(doc);
  const w = contentWidth(doc);
  const gap = LAYOUT.cardGap;
  const cardW = (w - gap * 2) / 3;
  const cardH = 68;

  const metrics = [
    { label: 'Crop Duration', value: summary.cropDuration, accent: COLORS.primary },
    { label: 'Expected Yield', value: summary.expectedYield, accent: COLORS.secondary },
    { label: 'Estimated Cost', value: summary.estimatedCost, accent: COLORS.dark },
    { label: 'Estimated Income', value: summary.estimatedIncome, accent: COLORS.secondary },
    { label: 'Estimated Profit', value: summary.estimatedProfit, accent: COLORS.primary },
    { label: 'Risk Level', value: summary.riskLevel, accent: COLORS.badgeDelayed }
  ];

  let mx = x;
  let my = doc.y;
  metrics.forEach((m, i) => {
    checkPageBreak(doc, report, cardH + 10);
    my = doc.y;
    drawMetricCard(doc, mx, my, cardW, cardH, m.label, m.value, { accent: m.accent });
    if ((i + 1) % 3 === 0) {
      mx = x;
      doc.y = my + cardH + gap;
    } else {
      mx += cardW + gap;
    }
  });
  if (metrics.length % 3 !== 0) {
    doc.y = my + cardH + gap;
  }

  doc.y += 6;

  // Current weather snapshot
  const weather = (report && report.weather) || {};
  checkPageBreak(doc, report, 90);
  doc.font(FONT.bold).fontSize(11).fillColor(COLORS.dark)
    .text('Current Weather', x, doc.y);
  doc.y += 16;
  const weatherHeight = drawWeatherCard(doc, x, doc.y, w, weather);
  doc.y += weatherHeight + LAYOUT.sectionGap;

  // Today's task + AI recommendation row
  const todaysTask = safe(summary.todaysTask, 'No task scheduled for today');
  const aiRecommendation = safe(summary.aiRecommendation, 'No recommendation available');

  checkPageBreak(doc, report, 90);
  const colW = (w - gap) / 2;
  const colY = doc.y;

  drawInfoCard(doc, x, colY, colW, "Today's Task", todaysTask);
  drawInfoCard(doc, x + colW + gap, colY, colW, 'AI Recommendation', aiRecommendation);
}

/* ============================================================================
 * PAGE 3 — FARM INFORMATION
 * ========================================================================== */

function drawFarmInformation(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Farm Information', {
    subtitle: 'Details used by the AI to build your farming plan',
    report
  });

  const location = (report && report.location) || {};
  const x = contentX(doc);
  const w = contentWidth(doc);
  const gap = LAYOUT.cardGap;
  const colW = (w - gap) / 2;

  const fields = [
    { label: 'State', value: location.state },
    { label: 'District', value: location.district },
    { label: 'Soil Type', value: report && report.soilType },
    { label: 'Water Source', value: report && report.waterSource },
    { label: 'Budget', value: report && report.budget },
    { label: 'Crop', value: report && report.crop },
    { label: 'Season', value: report && report.season },
    { label: 'Seed Recommendation', value: report && report.seedRecommendation }
  ];

  let colIndex = 0;
  let leftY = doc.y;
  let rightY = doc.y;

  fields.forEach((f) => {
    if (colIndex === 0) {
      checkPageBreak(doc, report, 65);
      leftY = doc.y;
      rightY = doc.y;
    }

    const targetX = colIndex === 0 ? x : x + colW + gap;
    const targetY = colIndex === 0 ? leftY : rightY;

    const h = drawInfoCard(doc, targetX, targetY, colW, f.label, f.value);
    const newY = targetY + h + LAYOUT.cardGap;

    if (colIndex === 0) {
      leftY = newY;
      colIndex = 1;
    } else {
      rightY = newY;
      colIndex = 0;
      doc.y = Math.max(leftY, rightY);
    }
  });

  doc.y = Math.max(leftY, rightY, doc.y);
}

/* ============================================================================
 * PAGE 4 — TIMELINE
 * ========================================================================== */

function drawTimelinePage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Crop Timeline', {
    subtitle: 'Week-by-week schedule for your crop cycle',
    report
  });

  const timeline = Array.isArray(report && report.timeline) ? report.timeline : [];

  if (timeline.length === 0) {
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted)
      .text('No timeline data is available for this report.', contentX(doc), doc.y);
    return;
  }

  timeline.forEach((item) => {
    drawTimelineCard(doc, item, { report, repeatTitle: 'Crop Timeline' });
  });
}

/* ============================================================================
 * PAGE 5 — EQUIPMENT
 * ========================================================================== */

function drawEquipmentPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Equipment', {
    subtitle: 'Machinery and tools recommended for this crop',
    report
  });

  const equipment = Array.isArray(report && report.equipment) ? report.equipment : [];
  const x = contentX(doc);
  const w = contentWidth(doc);
  const gap = LAYOUT.cardGap;
  const colW = (w - gap) / 2;

  if (equipment.length === 0) {
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted)
      .text('No equipment recommendations are available for this report.', x, doc.y);
    return;
  }

  let colIndex = 0;
  let leftY = doc.y;
  let rightY = doc.y;

  equipment.forEach((eq) => {
    const padding = 12;

    doc.font(FONT.regular).fontSize(9.5);
    const purposeText = String(safe(eq.purpose));
    const purposeHeight = doc.heightOfString(purposeText, { width: colW - padding * 2 });
    const cardHeight = 34 + purposeHeight + 26;

    if (colIndex === 0) {
      checkPageBreak(doc, report, cardHeight + 12);
      leftY = doc.y;
      rightY = doc.y;
    }

    const targetX = colIndex === 0 ? x : x + colW + gap;
    const cardY = colIndex === 0 ? leftY : rightY;

    doc.save();
    doc.roundedRect(targetX, cardY, colW, cardHeight, 6).fillAndStroke(COLORS.white, COLORS.border);
    doc.rect(targetX, cardY, colW, 6).fill(COLORS.primary);
    doc.restore();

    doc.font(FONT.bold).fontSize(11.5).fillColor(COLORS.dark)
      .text(String(safe(eq.name, 'Equipment')), targetX + padding, cardY + 16, { width: colW - padding * 2 });

    doc.font(FONT.regular).fontSize(9.5).fillColor(COLORS.muted)
      .text(purposeText, targetX + padding, cardY + 32, { width: colW - padding * 2 });

    doc.font(FONT.bold).fontSize(10).fillColor(COLORS.primary)
      .text(`Estimated Rent: ${safe(eq.estimatedRent)}`, targetX + padding, cardY + cardHeight - 20,
        { width: colW - padding * 2, lineBreak: false });

    const newY = cardY + cardHeight + gap;
    if (colIndex === 0) {
      leftY = newY;
      colIndex = 1;
    } else {
      rightY = newY;
      colIndex = 0;
      doc.y = Math.max(leftY, rightY);
    }
  });

  doc.y = Math.max(leftY, rightY, doc.y);
}

/* ============================================================================
 * PAGE 6 — LABOUR
 * ========================================================================== */

function drawLabourPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Labour', {
    subtitle: 'Estimated workforce required across activities',
    report
  });

  const labour = Array.isArray(report && report.labour) ? report.labour : [];
  const x = contentX(doc);
  const w = contentWidth(doc);

  if (labour.length === 0) {
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted)
      .text('No labour data is available for this report.', x, doc.y);
    return;
  }

  labour.forEach((item) => {
    const cardHeight = 56;
    checkPageBreak(doc, report, cardHeight + 12);
    const y = doc.y;

    doc.save();
    doc.roundedRect(x, y, w, cardHeight, 6).fillAndStroke(COLORS.white, COLORS.border);
    doc.rect(x, y, 5, cardHeight, 2).fill(COLORS.secondary);
    doc.restore();

    doc.font(FONT.bold).fontSize(11.5).fillColor(COLORS.dark)
      .text(String(safe(item.activity, 'Activity')), x + 18, y + 12, { width: w - 220 });

    const thirdW = 180;
    const rightColX = x + w - thirdW;
    doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
      .text('WORKERS', rightColX, y + 12, { width: thirdW / 2 - 10, align: 'right' });
    doc.font(FONT.bold).fontSize(11).fillColor(COLORS.primary)
      .text(String(safe(item.workers)), rightColX, y + 24, { width: thirdW / 2 - 10, align: 'right', lineBreak: false });

    doc.font(FONT.regular).fontSize(8.5).fillColor(COLORS.muted)
      .text('EST. DAYS', rightColX + thirdW / 2, y + 12, { width: thirdW / 2 - 10, align: 'right' });
    doc.font(FONT.bold).fontSize(11).fillColor(COLORS.primary)
      .text(String(safe(item.estimatedDays || item.days)), rightColX + thirdW / 2, y + 24, { width: thirdW / 2 - 10, align: 'right', lineBreak: false });

    doc.y = y + cardHeight + LAYOUT.cardGap;
  });
}

/* ============================================================================
 * PAGE 7 — FERTILIZER
 * ========================================================================== */

function drawFertilizerPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Fertilizer Schedule', {
    subtitle: 'Recommended fertilizer application plan',
    report
  });

  const fertilizer = Array.isArray(report && report.fertilizer) ? report.fertilizer : [];
  const w = contentWidth(doc);

  if (fertilizer.length === 0) {
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted)
      .text('No fertilizer schedule is available for this report.', contentX(doc), doc.y);
    return;
  }

  const rows = fertilizer.map((f) => [f.stage, f.fertilizer, f.quantity, f.time]);

  drawTable(doc, {
    headers: ['Stage', 'Fertilizer', 'Quantity', 'Time'],
    rows,
    columnWidths: [w * 0.22, w * 0.32, w * 0.22, w * 0.24],
    report,
    title: 'Fertilizer Schedule'
  });
}

/* ============================================================================
 * PAGE 8 — IRRIGATION
 * ========================================================================== */

function drawIrrigationPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Irrigation Schedule', {
    subtitle: 'Recommended watering plan for healthy crop growth',
    report
  });

  const irrigation = Array.isArray(report && report.irrigation) ? report.irrigation : [];
  const w = contentWidth(doc);

  if (irrigation.length === 0) {
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted)
      .text('No irrigation schedule is available for this report.', contentX(doc), doc.y);
    return;
  }

  const rows = irrigation.map((i) => [i.stage, i.frequency, i.waterRequirement]);

  drawTable(doc, {
    headers: ['Stage', 'Frequency', 'Water Requirement'],
    rows,
    columnWidths: [w * 0.3, w * 0.32, w * 0.38],
    report,
    title: 'Irrigation Schedule'
  });
}

/* ============================================================================
 * PAGE 9 — WEATHER
 * ========================================================================== */

function drawWeatherPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Weather Report', {
    subtitle: 'Latest conditions used to plan your farming activities',
    report
  });

  const weather = (report && report.weather) || {};
  const x = contentX(doc);
  const w = contentWidth(doc);

  const weatherHeight = drawWeatherCard(doc, x, doc.y, w, weather);
  doc.y += weatherHeight + LAYOUT.sectionGap;

  checkPageBreak(doc, report, 80);
  doc.font(FONT.bold).fontSize(11).fillColor(COLORS.dark)
    .text('Weather Recommendation', x, doc.y);
  doc.y += 16;

  const recommendation = safe(weather.recommendation, 'No specific weather recommendation is available at this time.');
  doc.font(FONT.regular).fontSize(10).fillColor(COLORS.dark)
    .text(String(recommendation), x, doc.y, { width: w });
}

/* ============================================================================
 * PAGE 10 — PRECAUTIONS, TIPS & REMINDERS
 * ========================================================================== */

function drawPrecautionsPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Precautions', {
    subtitle: 'Important safety and crop-care guidelines',
    report
  });

  drawBulletList(doc, report && report.precautions, { report, repeatTitle: 'Precautions' });

  doc.y += LAYOUT.sectionGap;
  checkPageBreak(doc, report, 40);
  drawSectionTitle(doc, 'Tips', {
    subtitle: 'Best practices to improve yield and reduce costs',
    report
  });

  drawBulletList(doc, report && report.tips, { report, repeatTitle: 'Tips' });

  const notes = (report && report.importantNotes) || (report && report.notes);
  if (notes && (!Array.isArray(notes) || notes.length > 0)) {
    doc.y += LAYOUT.sectionGap;
    checkPageBreak(doc, report, 40);
    drawSectionTitle(doc, 'Important Notes', { report });
    drawBulletList(doc, Array.isArray(notes) ? notes : [notes], { report, repeatTitle: 'Important Notes' });
  }

  const reminder = report && report.todaysReminder;
  if (reminder) {
    doc.y += LAYOUT.sectionGap;
    checkPageBreak(doc, report, 70);
    const x = contentX(doc);
    const w = contentWidth(doc);

    doc.font(FONT.regular).fontSize(10);
    const reminderHeight = doc.heightOfString(String(reminder), { width: w - 32 });
    const cardHeight = reminderHeight + 40;

    doc.save();
    doc.roundedRect(x, doc.y, w, cardHeight, 8).fillAndStroke(COLORS.light, COLORS.primary);
    doc.restore();

    doc.font(FONT.bold).fontSize(10).fillColor(COLORS.primary)
      .text("TODAY'S REMINDER", x + 16, doc.y + 12, { width: w - 32 });
    doc.font(FONT.regular).fontSize(10).fillColor(COLORS.dark)
      .text(String(reminder), x + 16, doc.y + 26, { width: w - 32 });

    doc.y += cardHeight;
  }
}

/* ============================================================================
 * LAST PAGE — CONTINUE ON FARMFLEET
 * ========================================================================== */

function drawFinalPage(doc, report) {
  doc.addPage();
  drawHeader(doc, report);
  drawFooter(doc, report);
  doc.y = contentTop(doc);

  drawSectionTitle(doc, 'Your Journey Continues', {
    subtitle: 'This report is just the beginning of your AI-powered farming plan',
    report
  });

  const x = contentX(doc);
  const w = contentWidth(doc);

  const notes = [
    'Your itinerary will continue to receive updates.',
    'Weather conditions may automatically change your schedule.',
    'Login to your FarmFleet account to view the latest recommendations.'
  ];

  drawBulletList(doc, notes, { report });

  doc.y += LAYOUT.sectionGap;
  checkPageBreak(doc, report, 200);
  drawLoginCard(doc, x, doc.y, w, report);

  doc.y += 220;
  checkPageBreak(doc, report, 70);

  const generatedDate = formatDate(report && report.generatedDate);
  const reportId = safe(report && report.reportId);
  const gap = LAYOUT.cardGap;
  const colW = (w - gap) / 2;

  drawInfoCard(doc, x, doc.y, colW, 'Report ID', reportId);
  drawInfoCard(doc, x + colW + gap, doc.y, colW, 'Generated Date', generatedDate);
}

/* ============================================================================
 * EXPORTS
 * ========================================================================== */

module.exports = {
  drawCoverPage,
  drawExecutiveSummary,
  drawFarmInformation,
  drawTimelinePage,
  drawEquipmentPage,
  drawLabourPage,
  drawFertilizerPage,
  drawIrrigationPage,
  drawWeatherPage,
  drawPrecautionsPage,
  drawFinalPage
};