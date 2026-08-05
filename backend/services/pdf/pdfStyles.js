/**
 * ============================================================================
 * FarmFleet AI - PDF Design System
 * ============================================================================
 *
 * File: services/pdf/pdfStyles.js
 *
 * Responsibility:
 *   This module is the PDF DESIGN SYSTEM for FarmFleet AI. It behaves like a
 *   UI component library, exposing:
 *     - Design tokens  (colors, fonts, font sizes, spacing, page settings,
 *                        card / table / badge / divider configuration)
 *     - Reusable, stateless PDFKit drawing utilities (header, footer,
 *       section titles, cards, tables, badges, timelines, etc.)
 *
 *   Every drawing utility in this file receives plain values as arguments
 *   (x, y, width, label, value, status, ...). It never reads a farmer,
 *   crop, weather, or report object directly, and never contains business
 *   logic, routing, authentication, or database/API access.
 *
 *   pdfTemplates.js is the only consumer of this file: every page it draws
 *   should be composed entirely from the utilities exported here.
 *
 * This file MUST NOT:
 *   - Query MongoDB / use Mongoose
 *   - Call the OpenWeather API or Gemini AI
 *   - Use Express, controllers, or routes
 *   - Contain authentication logic
 *   - Contain hardcoded farmer or report data
 *
 * Exports:
 *   colors, fonts, fontSizes, spacing, page,
 *   drawHeader, drawFooter, drawSectionTitle, drawInfoCard, drawMetricCard,
 *   drawWeatherCard, drawBadge, drawDivider, drawSimpleTable,
 *   drawTimelineCard, drawBulletList, drawKeyValue, drawLoginCard,
 *   drawRoundedBox, wrapText
 * ============================================================================
 */

'use strict';

/* ============================================================================
 * DESIGN TOKENS — COLORS
 * ========================================================================== */

const colors = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  accent: '#81C784',
  light: '#E8F5E9',
  backgroundGrey: '#F5F5F5',
  lightGrey: '#ECEFF1',
  borderGrey: '#CFD8DC',
  darkText: '#263238',
  mediumText: '#546E7A',
  white: '#FFFFFF',
  error: '#D32F2F',
  warning: '#F9A825',
  info: '#0288D1',
  success: '#2E7D32'
};

/* ============================================================================
 * DESIGN TOKENS — TYPOGRAPHY
 * ========================================================================== */

const fonts = {
  bold: 'Helvetica-Bold',
  regular: 'Helvetica',
  italic: 'Helvetica-Oblique'
};

const fontSizes = {
  mainTitle: 30,
  pageTitle: 22,
  sectionTitle: 18,
  cardTitle: 15,
  body: 11,
  small: 9,
  footer: 8
};

/* ============================================================================
 * DESIGN TOKENS — SPACING
 * ========================================================================== */

const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48
};

/* ============================================================================
 * DESIGN TOKENS — PAGE SETTINGS
 * ========================================================================== */

const page = {
  size: 'A4',
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  },
  headerHeight: 70,
  footerHeight: 40
};

/* ============================================================================
 * DESIGN TOKENS — CARD / TABLE / BADGE / DIVIDER
 * ========================================================================== */

const card = {
  radius: 10,
  padding: spacing.m,
  background: colors.white,
  border: colors.borderGrey,
  titleStripBackground: colors.light,
  shadowFill: '#F0F0F0'
};

const table = {
  radius: 6,
  headerBackground: colors.primary,
  headerTextColor: colors.white,
  rowEven: colors.white,
  rowOdd: colors.lightGrey,
  border: colors.borderGrey,
  cellPadding: spacing.s
};

const badge = {
  radius: 14,
  paddingX: 9,
  paddingY: 4,
  variants: {
    upcoming: { bg: '#E8F5E9', fg: colors.primary },
    completed: { bg: '#E3F2FD', fg: '#1565C0' },
    delayed: { bg: '#FFF3E0', fg: '#E65100' },
    cancelled: { bg: '#FFEBEE', fg: colors.error },
    default: { bg: colors.lightGrey, fg: colors.mediumText }
  }
};

const divider = {
  color: colors.borderGrey,
  thickness: 1
};

const button = {
  radius: 8
};

/* ============================================================================
 * INTERNAL GEOMETRY / TEXT HELPERS
 * (not exported directly — used to build the exported drawing utilities)
 * ========================================================================== */

/** Returns the printable content width for the current page. */
function getContentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/** Returns the left x-coordinate of the printable content area. */
function getContentX(doc) {
  return doc.page.margins.left;
}

/** Returns the y-coordinate at which body content should start (below the header). */
function getContentTop(doc) {
  return doc.page.margins.top + page.headerHeight;
}

/** Returns the y-coordinate at which body content must stop (above the footer). */
function getContentBottom(doc) {
  return doc.page.height - doc.page.margins.bottom - page.footerHeight;
}

/**
 * wrapText()
 * Calculates the rendered height and line count of a text block for a
 * given width, font and font size, without drawing anything. Used by every
 * other utility to reserve the correct amount of vertical space and to
 * decide whether a page break is required.
 */
function wrapText(doc, text, width, fontSize = fontSizes.body, font = fonts.regular) {
  const value = text === undefined || text === null ? '' : String(text);

  doc.save();
  doc.font(font).fontSize(fontSize);
  const height = doc.heightOfString(value, { width });
  const lineHeight = doc.currentLineHeight(true);
  doc.restore();

  const lineCount = Math.max(1, Math.round(height / lineHeight));

  return { text: value, width, height, lineHeight, lineCount };
}

/**
 * Ensures there is enough vertical space left on the page for the next
 * block of content. If not, starts a new page, redraws the standard
 * header, and resets doc.y to the content start position.
 *
 * `onNewPage` is an optional callback invoked after the new page is
 * created (e.g. to redraw a repeated section title). Footers are expected
 * to be drawn by the caller for each page, since this module does not
 * track when a page is considered "finished".
 */
function checkPageBreak(doc, requiredHeight, onNewPage) {
  const limit = getContentBottom(doc);
  if (doc.y + requiredHeight > limit) {
    doc.addPage();
    drawHeader(doc);
    doc.y = getContentTop(doc);
    if (typeof onNewPage === 'function') onNewPage();
    return true;
  }
  return false;
}

/* ============================================================================
 * COMMON HELPERS
 * ========================================================================== */

/** Draws text centered horizontally within a given width. */
function centerText(doc, text, x, y, width, options = {}) {
  doc.font(options.font || fonts.regular)
    .fontSize(options.fontSize || fontSizes.body)
    .fillColor(options.color || colors.darkText)
    .text(String(text), x, y, Object.assign({ width, align: 'center' }, options.textOptions));
}

/** Draws text right-aligned within a given width. */
function rightAlign(doc, text, x, y, width, options = {}) {
  doc.font(options.font || fonts.regular)
    .fontSize(options.fontSize || fontSizes.body)
    .fillColor(options.color || colors.darkText)
    .text(String(text), x, y, Object.assign({ width, align: 'right' }, options.textOptions));
}

/** Draws a straight line between two points. */
function drawLine(doc, x1, y1, x2, y2, options = {}) {
  doc.save();
  doc.strokeColor(options.color || colors.borderGrey);
  doc.lineWidth(options.thickness || divider.thickness);
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  doc.restore();
}

/** Draws a plain (square-cornered) filled and/or stroked box. */
function drawBox(doc, x, y, width, height, options = {}) {
  doc.save();
  const fill = options.fill;
  const stroke = options.stroke;
  doc.rect(x, y, width, height);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill) doc.fill(fill);
  else if (stroke) doc.stroke(stroke);
  doc.restore();
}

/**
 * drawRoundedBox()
 * Draws a rounded rectangle, optionally filled and/or stroked, and
 * optionally with a soft "shadow" simulated using an offset, very light
 * grey rectangle behind it (PDFKit has no native shadow support).
 */
function drawRoundedBox(doc, x, y, width, height, radius = card.radius, options = {}) {
  doc.save();

  if (options.shadow) {
    const offset = options.shadowOffset || 2;
    doc.roundedRect(x + offset, y + offset, width, height, radius).fill(card.shadowFill);
  }

  const fill = options.fill;
  const stroke = options.stroke;
  doc.roundedRect(x, y, width, height, radius);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill) doc.fill(fill);
  else if (stroke) doc.stroke(stroke);

  doc.restore();
}

/** Draws a small uppercase label (used above values in cards / key-value pairs). */
function drawLabel(doc, text, x, y, width, options = {}) {
  doc.font(options.font || fonts.bold)
    .fontSize(options.fontSize || fontSizes.small)
    .fillColor(options.color || colors.mediumText)
    .text(String(text).toUpperCase(), x, y, { width, lineBreak: options.lineBreak !== false ? true : false });
}

/** Draws a value string beneath a label. */
function drawValue(doc, text, x, y, width, options = {}) {
  doc.font(options.font || fonts.bold)
    .fontSize(options.fontSize || fontSizes.body)
    .fillColor(options.color || colors.darkText)
    .text(String(text === undefined || text === null || text === '' ? 'Not available' : text), x, y, { width });
}

/** Draws a wrapping block of body text. */
function drawParagraph(doc, text, x, y, width, options = {}) {
  doc.font(options.font || fonts.regular)
    .fontSize(options.fontSize || fontSizes.body)
    .fillColor(options.color || colors.darkText)
    .text(String(text === undefined || text === null || text === '' ? '' : text), x, y, { width });
}

/** Draws a large page/main title. */
function drawTitle(doc, text, x, y, width, options = {}) {
  doc.font(fonts.bold)
    .fontSize(options.fontSize || fontSizes.pageTitle)
    .fillColor(options.color || colors.darkText)
    .text(String(text), x, y, { width, align: options.align || 'left' });
}

/** Draws a muted subtitle line beneath a title. */
function drawSubtitle(doc, text, x, y, width, options = {}) {
  doc.font(fonts.regular)
    .fontSize(options.fontSize || fontSizes.small)
    .fillColor(options.color || colors.mediumText)
    .text(String(text), x, y, { width, align: options.align || 'left' });
}

/** Fills the full current page with a background color (used sparingly). */
function drawPageBackground(doc, color = colors.white) {
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(color);
  doc.restore();
}

/** Advances doc.y by a named spacing token (or explicit pixel amount). */
function drawSectionSpacing(doc, size = 'm') {
  const amount = typeof size === 'number' ? size : (spacing[size] !== undefined ? spacing[size] : spacing.m);
  doc.y += amount;
}

/* ============================================================================
 * drawHeader()
 * Standard page header: logo placeholder + project name + divider.
 * Contains no report-specific data.
 * ========================================================================== */

function drawHeader(doc, options = {}) {
  const x = getContentX(doc);
  const y = doc.page.margins.top;
  const w = getContentWidth(doc);
  const logoSize = options.logoSize || 26;

  // Logo placeholder — a simple circular mark, no external image asset required
  doc.save();
  doc.circle(x + logoSize / 2, y + logoSize / 2, logoSize / 2).fill(colors.primary);
  doc.restore();

  doc.font(fonts.bold).fontSize(fontSizes.cardTitle).fillColor(colors.darkText)
    .text('FarmFleet AI', x + logoSize + 10, y + 1, { lineBreak: false });

  doc.font(fonts.regular).fontSize(fontSizes.small).fillColor(colors.mediumText)
    .text(options.tagline || 'AI Powered Smart Farming', x + logoSize + 10, y + 17, { lineBreak: false });

  drawLine(doc, x, y + logoSize + 12, x + w, y + logoSize + 12, { color: divider.color });

  doc.y = getContentTop(doc);
}

/* ============================================================================
 * drawFooter()
 * Standard page footer: brand line + website + auto-incrementing page
 * number. Fixed to the bottom margin area; does not move the content cursor.
 * ========================================================================== */

function drawFooter(doc, options = {}) {
  const x = getContentX(doc);
  const w = getContentWidth(doc);
  const footerTop = doc.page.height - doc.page.margins.bottom - page.footerHeight + 8;

  drawLine(doc, x, footerTop, x + w, footerTop, { color: divider.color });

  doc._ffPageIndex = (doc._ffPageIndex || 0) + 1;
  const pageNumber = options.pageNumber || doc._ffPageIndex;

  doc.font(fonts.regular).fontSize(fontSizes.footer).fillColor(colors.mediumText)
    .text('Generated by FarmFleet AI  |  www.farmfleet.ai', x, footerTop + 10, {
      width: w * 0.7,
      lineBreak: false
    });

  rightAlign(doc, `Page ${pageNumber}`, x, footerTop + 10, w, {
    fontSize: fontSizes.footer,
    color: colors.mediumText
  });
}

/* ============================================================================
 * drawSectionTitle()
 * Green section heading with a small accent bar and a divider underneath.
 * ========================================================================== */

function drawSectionTitle(doc, title, options = {}) {
  const x = getContentX(doc);
  const w = getContentWidth(doc);

  checkPageBreak(doc, 40);

  const y = doc.y;
  doc.save();
  doc.rect(x, y + 3, 4, fontSizes.sectionTitle - 4).fill(colors.primary);
  doc.restore();

  doc.font(fonts.bold).fontSize(fontSizes.sectionTitle).fillColor(colors.darkText)
    .text(options.continued ? `${title} (continued)` : title, x + 12, y, { width: w - 12 });

  doc.y = y + fontSizes.sectionTitle + 8;

  if (options.subtitle) {
    drawSubtitle(doc, options.subtitle, x + 12, doc.y, w - 12);
    doc.y += 14;
  }

  drawLine(doc, x, doc.y + 4, x + w, doc.y + 4, { color: divider.color });
  doc.y += 4 + spacing.s;
}

/* ============================================================================
 * drawInfoCard()
 * Rounded card with a light title strip, a label, and a wrapping value.
 * Returns the total height consumed so callers can lay out grids.
 * ========================================================================== */

function drawInfoCard(doc, x, y, width, label, value, options = {}) {
  const padding = card.padding;
  const stripHeight = 20;
  const valueInfo = wrapText(doc, value === undefined || value === null || value === '' ? 'Not available' : value,
    width - padding * 2, fontSizes.body, fonts.bold);

  const height = stripHeight + padding * 0.5 + valueInfo.height + padding * 0.75;

  drawRoundedBox(doc, x, y, width, height, card.radius, { fill: card.background, stroke: card.border });

  doc.save();
  doc.roundedRect(x, y, width, stripHeight, card.radius).fill(card.titleStripBackground);
  doc.rect(x, y + stripHeight - card.radius, width, card.radius).fill(card.titleStripBackground);
  doc.restore();

  drawLabel(doc, label, x + padding, y + 5, width - padding * 2, { color: colors.primary });
  drawValue(doc, value, x + padding, y + stripHeight + 6, width - padding * 2);

  return height;
}

/* ============================================================================
 * drawMetricCard()
 * Compact card used for KPI-style figures: a green top strip, a large
 * bold value, and a small subtitle/caption.
 * ========================================================================== */

function drawMetricCard(doc, x, y, width, height, value, subtitle, options = {}) {
  const accent = options.accent || colors.primary;
  const stripHeight = 4;
  const padding = card.padding;

  drawRoundedBox(doc, x, y, width, height, card.radius, { fill: card.background, stroke: card.border });

  doc.save();
  doc.roundedRect(x, y, width, stripHeight, 2).fill(accent);
  doc.rect(x, y + stripHeight, width, 1).fill(accent);
  doc.restore();

  if (options.label) {
    drawLabel(doc, options.label, x + padding, y + stripHeight + 8, width - padding * 2, { color: colors.mediumText });
  }

  doc.font(fonts.bold).fontSize(options.valueFontSize || fontSizes.cardTitle).fillColor(colors.darkText)
    .text(String(value === undefined || value === null || value === '' ? 'Not available' : value),
      x + padding, y + stripHeight + (options.label ? 22 : 10), { width: width - padding * 2, lineBreak: false });

  if (subtitle) {
    doc.font(fonts.regular).fontSize(fontSizes.footer).fillColor(colors.mediumText)
      .text(String(subtitle), x + padding, y + height - 18, { width: width - padding * 2, lineBreak: false });
  }
}

/* ============================================================================
 * drawWeatherCard()
 * Premium weather summary card: condition headline, a metric row
 * (temperature / humidity / wind), and an optional recommendation line.
 * Receives plain weather values — never fetches weather data itself.
 * ========================================================================== */

function drawWeatherCard(doc, x, y, width, weather = {}, options = {}) {
  const padding = card.padding;
  const metricsRowHeight = 44;
  const conditionRowHeight = 26;
  const hasRecommendation = Boolean(weather.recommendation);

  const recInfo = hasRecommendation
    ? wrapText(doc, weather.recommendation, width - padding * 2, fontSizes.small, fonts.regular)
    : { height: 0 };

  const height = conditionRowHeight + metricsRowHeight + (hasRecommendation ? recInfo.height + padding : padding * 0.5);

  drawRoundedBox(doc, x, y, width, height, card.radius, { fill: colors.light, stroke: card.border });

  doc.font(fonts.bold).fontSize(fontSizes.cardTitle).fillColor(colors.darkText)
    .text(`Condition: ${weather.condition || 'Not available'}`, x + padding, y + 10, {
      width: width - padding * 2,
      lineBreak: false
    });

  const metrics = [
    { label: 'Temperature', value: weather.temperature !== undefined ? `${weather.temperature}°C` : undefined },
    { label: 'Humidity', value: weather.humidity !== undefined ? `${weather.humidity}%` : undefined },
    { label: 'Wind Speed', value: weather.windSpeed !== undefined ? `${weather.windSpeed} km/h` : undefined }
  ];

  const colWidth = (width - padding * 2) / metrics.length;
  metrics.forEach((m, i) => {
    const cx = x + padding + i * colWidth;
    drawLabel(doc, m.label, cx, y + conditionRowHeight + 8, colWidth - 8, { color: colors.mediumText });
    doc.font(fonts.bold).fontSize(fontSizes.body).fillColor(colors.primary)
      .text(m.value || 'Not available', cx, y + conditionRowHeight + 22, { width: colWidth - 8, lineBreak: false });
  });

  if (hasRecommendation) {
    drawParagraph(doc, weather.recommendation, x + padding, y + conditionRowHeight + metricsRowHeight,
      width - padding * 2, { fontSize: fontSizes.small, color: colors.darkText });
  }

  return height;
}

/* ============================================================================
 * drawBadge()
 * Small rounded status pill. Supported statuses: upcoming, completed,
 * delayed, cancelled (falls back to a neutral grey badge otherwise).
 * ========================================================================== */

function drawBadge(doc, status, x, y, options = {}) {
  const key = String(status || '').trim().toLowerCase();
  const variant = badge.variants[key] || badge.variants.default;
  const label = options.label || (status ? String(status) : 'Unknown');

  doc.font(fonts.bold).fontSize(fontSizes.footer);
  const textWidth = doc.widthOfString(label);
  const badgeWidth = textWidth + badge.paddingX * 2;
  const badgeHeight = fontSizes.footer + badge.paddingY * 2;

  doc.save();
  doc.roundedRect(x, y, badgeWidth, badgeHeight, badge.radius).fill(variant.bg);
  doc.restore();

  doc.font(fonts.bold).fontSize(fontSizes.footer).fillColor(variant.fg)
    .text(label, x + badge.paddingX, y + badge.paddingY, { lineBreak: false });

  return { width: badgeWidth, height: badgeHeight };
}

/* ============================================================================
 * drawDivider()
 * Simple horizontal divider line with consistent color/thickness.
 * ========================================================================== */

function drawDivider(doc, x, y, width, options = {}) {
  drawLine(doc, x, y, x + width, y, {
    color: options.color || divider.color,
    thickness: options.thickness || divider.thickness
  });
}

/* ============================================================================
 * drawBulletList()
 * Renders a list of bullet items with consistent spacing, automatic text
 * wrapping, and automatic page breaks.
 * ========================================================================== */

function drawBullet(doc, x, y, width, text, options = {}) {
  doc.save();
  doc.circle(x + 3, y + 5, 2).fill(options.bulletColor || colors.primary);
  doc.restore();

  drawParagraph(doc, text, x + 12, y, width - 12, {
    fontSize: options.fontSize || fontSizes.body,
    color: options.color || colors.darkText
  });
}

function drawBulletList(doc, items, x, y, width, options = {}) {
  const list = Array.isArray(items) && items.length > 0 ? items : ['Not available'];
  doc.y = y !== undefined ? y : doc.y;
  const listX = x !== undefined ? x : getContentX(doc);
  const listWidth = width !== undefined ? width : getContentWidth(doc);

  list.forEach((item) => {
    const info = wrapText(doc, item, listWidth - 12, options.fontSize || fontSizes.body, fonts.regular);
    const itemHeight = Math.max(info.height, 15) + spacing.xs;

    checkPageBreak(doc, itemHeight, options.onNewPage);

    drawBullet(doc, listX, doc.y, listWidth, item, options);
    doc.y += itemHeight;
  });

  return doc.y;
}

/* ============================================================================
 * drawSimpleTable()
 * Styled table: rounded green header, alternating row backgrounds, grey
 * borders, cell padding, dynamic column widths, automatic wrapping, and
 * automatic page breaks (repeating the header row on each new page).
 * ========================================================================== */

function drawSimpleTable(doc, { headers, rows, columnWidths, x, y }, options = {}) {
  const tableX = x !== undefined ? x : getContentX(doc);
  const tableWidth = columnWidths ? columnWidths.reduce((a, b) => a + b, 0) : getContentWidth(doc);
  const widths = columnWidths && columnWidths.length === headers.length
    ? columnWidths
    : headers.map(() => tableWidth / headers.length);

  const headerHeight = 24;
  const cellPadding = table.cellPadding;

  doc.y = y !== undefined ? y : doc.y;

  function drawTableHeader() {
    checkPageBreak(doc, headerHeight + 20, options.onNewPage);
    const hy = doc.y;

    doc.save();
    doc.roundedRect(tableX, hy, tableWidth, headerHeight, table.radius).fill(table.headerBackground);
    doc.restore();

    let cx = tableX;
    headers.forEach((h, i) => {
      doc.font(fonts.bold).fontSize(fontSizes.small).fillColor(table.headerTextColor)
        .text(String(h), cx + cellPadding, hy + 7, { width: widths[i] - cellPadding * 2, lineBreak: false });
      cx += widths[i];
    });

    doc.y = hy + headerHeight;
  }

  drawTableHeader();

  rows.forEach((row, rowIndex) => {
    const cellHeights = row.map((cell, i) =>
      wrapText(doc, cell, widths[i] - cellPadding * 2, fontSizes.small, fonts.regular).height
    );
    const rowHeight = Math.max(...cellHeights, 12) + cellPadding * 2;

    if (doc.y + rowHeight > getContentBottom(doc)) {
      doc.addPage();
      drawHeader(doc);
      doc.y = getContentTop(doc);
      if (typeof options.onNewPage === 'function') options.onNewPage();
      drawTableHeader();
    }

    const rowY = doc.y;
    const bg = rowIndex % 2 === 0 ? table.rowEven : table.rowOdd;

    doc.save();
    doc.rect(tableX, rowY, tableWidth, rowHeight).fill(bg);
    doc.restore();

    let cx = tableX;
    row.forEach((cell, i) => {
      drawParagraph(doc, cell === undefined || cell === null || cell === '' ? '-' : cell,
        cx + cellPadding, rowY + cellPadding, widths[i] - cellPadding * 2, { fontSize: fontSizes.small });
      cx += widths[i];
    });

    drawLine(doc, tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight, { color: table.border, thickness: 0.5 });

    doc.y = rowY + rowHeight;
  });

  doc.y += spacing.m;
}

/* ============================================================================
 * drawTimelineCard()
 * Vertical-timeline entry: connector dot/line + card containing week,
 * activity title, description, date, and a status badge.
 * ========================================================================== */

function drawTimelineCard(doc, item = {}, options = {}) {
  const x = options.x !== undefined ? options.x : getContentX(doc);
  const w = options.width !== undefined ? options.width : getContentWidth(doc);
  const railX = x + 6;
  const cardX = x + 24;
  const cardW = w - 24;
  const padding = card.padding;

  const description = item.description || '';
  const descInfo = description ? wrapText(doc, description, cardW - padding * 2, fontSizes.small, fonts.regular) : { height: 0 };

  const height = 30 + descInfo.height + 22 + padding;

  checkPageBreak(doc, height + 10, options.onNewPage);
  const y = doc.y;

  doc.save();
  doc.circle(railX, y + 12, 4).fill(colors.primary);
  doc.strokeColor(colors.borderGrey).lineWidth(1.5);
  doc.moveTo(railX, y + 16).lineTo(railX, y + height).stroke();
  doc.restore();

  drawRoundedBox(doc, cardX, y, cardW, height, card.radius, { fill: card.background, stroke: card.border });

  doc.font(fonts.bold).fontSize(fontSizes.small).fillColor(colors.primary)
    .text(`WEEK ${item.week !== undefined ? item.week : '-'}`, cardX + padding, y + 10, {
      width: cardW - padding * 2 - 90,
      lineBreak: false
    });

  doc.font(fonts.bold).fontSize(fontSizes.cardTitle - 3).fillColor(colors.darkText)
    .text(item.activity || item.title || 'Untitled Activity', cardX + padding, y + 22, {
      width: cardW - padding * 2 - 90
    });

  if (item.status) {
    drawBadge(doc, item.status, cardX + cardW - padding - 74, y + 10);
  }

  if (description) {
    drawParagraph(doc, description, cardX + padding, y + 38, cardW - padding * 2, { fontSize: fontSizes.small, color: colors.mediumText });
  }

  doc.font(fonts.regular).fontSize(fontSizes.footer).fillColor(colors.mediumText)
    .text(`Scheduled: ${item.date || 'Not available'}`, cardX + padding, y + height - 16, {
      width: cardW - padding * 2,
      lineBreak: false
    });

  doc.y = y + height + spacing.m;

  return height;
}

/* ============================================================================
 * drawKeyValue()
 * Simple reusable label/value pair, used anywhere a full card is
 * unnecessary (e.g. compact detail rows).
 * ========================================================================== */

function drawKeyValue(doc, label, value, x, y, width, options = {}) {
  const labelWidth = options.labelWidth || width * 0.4;
  const valueWidth = width - labelWidth;

  drawLabel(doc, label, x, y, labelWidth, { color: colors.mediumText, fontSize: fontSizes.small });
  drawValue(doc, value, x + labelWidth, y, valueWidth, { fontSize: options.fontSize || fontSizes.body });

  const info = wrapText(doc, value, valueWidth, options.fontSize || fontSizes.body, fonts.bold);
  return Math.max(info.height, fontSizes.small + 2);
}

/* ============================================================================
 * drawLoginCard()
 * "Continue on FarmFleet" call-to-action card used in place of a QR code.
 * Receives a dynamic login URL — never hardcodes it.
 * ========================================================================== */

function drawLoginCard(doc, { loginUrl, description, benefits } = {}, x, y, width, options = {}) {
  const padding = card.padding;
  const title = options.title || 'Continue on FarmFleet';
  const bodyText = description || 'Login to your FarmFleet account to view live updates and AI recommendations.';

  const list = Array.isArray(benefits) ? benefits : [];
  const descInfo = wrapText(doc, bodyText, width - padding * 2, fontSizes.body, fonts.regular);

  const height = 30 + descInfo.height + (list.length ? list.length * 15 + 10 : 0) + 44;

  drawRoundedBox(doc, x, y, width, height, card.radius, { fill: colors.light, stroke: colors.primary });

  doc.font(fonts.bold).fontSize(fontSizes.cardTitle).fillColor(colors.primary)
    .text(title, x + padding, y + 14, { width: width - padding * 2 });

  let cy = y + 14 + fontSizes.cardTitle + 6;
  drawParagraph(doc, bodyText, x + padding, cy, width - padding * 2, { fontSize: fontSizes.body });
  cy += descInfo.height + 8;

  list.forEach((b) => {
    drawBullet(doc, x + padding, cy, width - padding * 2, b, { fontSize: fontSizes.small });
    cy += 15;
  });

  cy += 8;
  doc.font(fonts.regular).fontSize(fontSizes.small).fillColor(colors.darkText)
    .text('Login at:', x + padding, cy, { width: width - padding * 2 });

  doc.font(fonts.bold).fontSize(fontSizes.body).fillColor(colors.primary)
    .text(loginUrl || 'https://farmfleet.ai/login', x + padding, cy + 14, {
      width: width - padding * 2,
      lineBreak: false
    });

  return height;
}

/* ============================================================================
 * EXPORTS
 * ========================================================================== */

module.exports = {
  // Design tokens
  colors,
  fonts,
  fontSizes,
  spacing,
  page,
  card,
  table,
  badge,
  divider,
  button,

  // Drawing utilities
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawInfoCard,
  drawMetricCard,
  drawWeatherCard,
  drawBadge,
  drawDivider,
  drawSimpleTable,
  drawTimelineCard,
  drawBulletList,
  drawKeyValue,
  drawLoginCard,
  drawRoundedBox,
  wrapText,

  // Common helpers
  centerText,
  rightAlign,
  drawLine,
  drawBox,
  drawLabel,
  drawValue,
  drawParagraph,
  drawTitle,
  drawSubtitle,
  drawPageBackground,
  drawSectionSpacing
};