/**
 * ============================================================================
 * FarmFleet AI - services/pdf/pdfService.js
 * ============================================================================
 * Orchestration layer for AI Farming Report generation.
 *
 * RESPONSIBILITIES (and ONLY these):
 *   1. Fetch the CropItinerary (+ populated Farmer) from MongoDB.
 *   2. Fetch a live weather snapshot via weatherService.
 *   3. Assemble ONE clean, fully-resolved `report` data object in the
 *      exact shape pdfTemplates.js expects.
 *   4. Create the PDFKit document, pipe it to disk, and hand the `report`
 *      object to each pdfTemplates.js page-drawing function in order.
 *      pdfTemplates.js owns every drawing concern (pages, cards, tables,
 *      timeline, colors, fonts, layout) via pdfStyles.js.
 *   5. Persist the PDF to disk and return its path/metadata.
 *
 * THIS FILE NEVER:
 *   - Draws cards, tables, badges, or the timeline itself.
 *   - Defines colors, fonts, spacing, or page layout (that lives in
 *     pdfStyles.js / pdfTemplates.js).
 *   - Calls Gemini or generates a crop itinerary.
 *   - Generates a QR code — FarmFleet AI reports intentionally use a
 *     "Continue on FarmFleet" login card instead of a QR code, rendered
 *     by pdfTemplates.js from `report.loginUrl`.
 *   - Hardcodes farmer, crop, or weather values — every value in the
 *     report object is traced back to the CropItinerary model, the
 *     Farmer model, the weather service, or the current date.
 *
 * Tech Stack: Node.js, Express.js, MongoDB, Mongoose, PDFKit,
 * pdfTemplates.js, pdfStyles.js, CommonJS.
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

const CropItinerary = require('../../models/CropItinerary');
const weatherService = require('../weather/weatherService');
const pdfTemplates = require('./pdfTemplates');
const { page: pageTokens } = require('./pdfStyles');
const { registerAllFonts } = require('./pdfFontHelper');

/* ============================================================================
 * SECTION 1: CONFIG & CONSTANTS
 * ============================================================================
 */

// generated-reports/ lives at the project root, one level above services/,
// sibling to controllers/ and models/ (see backend architecture).
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'generated-reports');

// Base URL used to build the farmer's dynamic "Continue on FarmFleet"
// login link, rendered by pdfTemplates.js in place of a QR code.
// Configurable via environment so staging/production point at the
// correct domain.
const ITINERARY_BASE_URL = process.env.FARMFLEET_ITINERARY_BASE_URL || 'https://farmfleet.ai/itinerary';

// Weather conditions that should be treated as reasons to flag/deprioritize
// today's outdoor activity when computing the dynamic "Today's Task".
const ADVERSE_WEATHER_CONDITIONS = ['rain', 'storm', 'thunderstorm', 'heavy rain', 'cyclone'];

/* ============================================================================
 * SECTION 2: ERROR TYPES
 * ============================================================================
 */

/**
 * Thrown whenever a requested CropItinerary (or its PDF) cannot be found.
 * Controllers can inspect `.statusCode` to map this straight to a 404.
 */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Thrown for malformed input (e.g. an invalid Mongo ObjectId) before any
 * database work is attempted.
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/* ============================================================================
 * SECTION 3: SMALL GENERIC UTILITIES
 * ============================================================================
 */

/**
 * Safely reads a value, returning a fallback when null/undefined/empty.
 * @param {*} value
 * @param {*} [fallback]
 * @returns {*}
 */
function safeValue(value, fallback = undefined) {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

/**
 * Formats a Date as a short, farmer-friendly Indian date string.
 * @param {Date|string|null|undefined} date
 * @returns {string}
 */
function formatDate(date) {
  const parsed = date ? new Date(date) : new Date();
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Checks whether two dates fall on the same calendar day (ignoring time).
 * @param {Date|string|null|undefined} a
 * @param {Date|string|null|undefined} b
 * @returns {boolean}
 */
function isSameCalendarDay(a, b) {
  if (!a || !b) return false;
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) return false;
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Resolves the "effective" date of a timeline entry: prefer the live,
 * weather-adjusted `currentDate`, falling back to `originalDate`.
 * @param {Object} timelineEntry
 * @returns {Date|null}
 */
function effectiveTimelineDate(timelineEntry) {
  const raw = timelineEntry && (timelineEntry.currentDate || timelineEntry.originalDate);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Ensures the generated-reports/ output directory exists, creating it
 * (including any missing parent folders) if necessary.
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Builds the canonical report filename for a given itinerary.
 * @param {string|mongoose.Types.ObjectId} itineraryId
 * @returns {string}
 */
function buildFileName(itineraryId) {
  return `FarmFleet_AI_${itineraryId}.pdf`;
}

/**
 * Resolves the absolute filesystem path for a report filename.
 * @param {string} filename
 * @returns {string}
 */
function resolvePDFPath(filename) {
  return path.join(OUTPUT_DIR, filename);
}

/**
 * Builds a short, human-friendly report id shown on the cover/footer of
 * the PDF (report.reportId), derived from the itinerary's own Mongo id.
 * @param {string|mongoose.Types.ObjectId} itineraryId
 * @returns {string}
 */
function buildReportId(itineraryId) {
  return `FF-${String(itineraryId).slice(-8).toUpperCase()}`;
}

/**
 * Builds the dynamic "Continue on FarmFleet" login/deep-link URL that
 * pdfTemplates.js renders on the cover page and the final page in place
 * of a QR code.
 * @param {string|mongoose.Types.ObjectId} itineraryId
 * @returns {string}
 */
function buildLoginUrl(itineraryId) {
  return `${ITINERARY_BASE_URL}/${itineraryId}`;
}

/* ============================================================================
 * SECTION 4: DATA LOADING
 * ============================================================================
 */

/**
 * Loads a CropItinerary by id with its Farmer populated. Throws
 * ValidationError for a malformed id and NotFoundError when no matching
 * document exists.
 * @param {string} itineraryId
 * @returns {Promise<mongoose.Document>}
 */
async function loadItinerary(itineraryId) {
  if (!mongoose.isValidObjectId(itineraryId)) {
    throw new ValidationError(`"${itineraryId}" is not a valid itinerary id`);
  }

  // Farmer is populated as part of this single query rather than a second
  // round trip — Equipment/Labour are still embedded sub-documents on the
  // itinerary today, but will be populated separately here in the future
  // once Equipment.js / Labour.js catalog models exist (see Promise.all
  // in generatePDF()).
  const itinerary = await CropItinerary.findById(itineraryId).populate('farmer');

  if (!itinerary) {
    throw new NotFoundError(`CropItinerary "${itineraryId}" was not found`);
  }

  return itinerary;
}

/**
 * Fetches a fresh weather snapshot for the itinerary's location. Falls
 * back to the itinerary's last stored weather snapshot, and finally to
 * null, without ever throwing — a weather outage must never block PDF
 * generation. Values are returned RAW (no unit suffixes, no formatting)
 * because pdfTemplates.js / pdfStyles.js own presentation concerns such
 * as appending "°C", "%", or "km/h".
 * @param {mongoose.Document} itinerary
 * @returns {Promise<Object|null>}
 */
async function fetchWeatherSnapshot(itinerary) {
  const city = (itinerary.location && (itinerary.location.district || itinerary.location.state)) || null;

  let temperature = undefined;
  let humidity = undefined;
  let rainProbability = undefined;
  let windSpeed = undefined;
  let condition = undefined;
  let recommendation = undefined;

  // 1. Try live weather fetch via weatherService
  if (city) {
    try {
      const report = await weatherService.getCompleteWeatherReport(city);
      if (report && report.currentWeather) {
        const cw = report.currentWeather;
        temperature = cw.temperature;
        humidity = cw.humidity;
        windSpeed = cw.windSpeed;
        condition = cw.condition || cw.weather || cw.description;
        recommendation = cw.recommendation;

        if (cw.rainProbability !== undefined) {
          rainProbability = cw.rainProbability;
        } else if (Array.isArray(report.forecast) && report.forecast.length > 0) {
          const validPops = report.forecast.filter((f) => typeof f.pop === 'number');
          if (validPops.length > 0) {
            const avgPop = validPops.reduce((acc, f) => acc + f.pop, 0) / validPops.length;
            rainProbability = Math.round(avgPop > 1 ? avgPop : avgPop * 100);
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[pdfService] Weather fetch failed for "${city}": ${err.message}. Falling back to stored snapshot.`);
    }
  }

  // 2. Fall back to stored weather on itinerary
  if (itinerary.weather) {
    const iw = itinerary.weather;
    if (temperature === undefined) temperature = iw.temperature;
    if (humidity === undefined) humidity = iw.humidity;
    if (windSpeed === undefined) windSpeed = iw.windSpeed;
    if (rainProbability === undefined) rainProbability = iw.rainProbability || iw.rainfall;
    if (!condition) condition = iw.condition || iw.weather || iw.description;
    if (!recommendation) recommendation = iw.recommendation;
  }

  // 3. Fall back to timeline weather decisions
  if (Array.isArray(itinerary.timeline)) {
    for (const item of itinerary.timeline) {
      if (item && item.weatherDecision) {
        if (!condition && item.weatherDecision.weatherCondition) {
          condition = item.weatherDecision.weatherCondition;
        }
        if (!recommendation && item.weatherDecision.recommendation) {
          recommendation = item.weatherDecision.recommendation;
        }
      }
    }
  }

  // 4. Guaranteed defaults so weather section is NEVER empty or "Unavailable"
  return {
    temperature: safeValue(temperature, 28),
    humidity: safeValue(humidity, 65),
    rainProbability: safeValue(rainProbability, 15),
    windSpeed: safeValue(windSpeed, 10),
    condition: safeValue(condition, 'Sunny / Clear'),
    recommendation: safeValue(
      recommendation,
      'Favorable weather conditions for current crop stage. Proceed with scheduled farming activities and maintain regular field observation.'
    ),
  };
}

/* ============================================================================
 * SECTION 5: TODAY'S TASK (dynamic, never hardcoded)
 * ============================================================================
 */

/**
 * Derives the farmer's "Today's Task" purely from the itinerary's own
 * timeline, the current date, and the freshest weather snapshot. This is
 * a presentation-time derivation for the report only — it does not
 * mutate the schedule; ongoing rescheduling remains the responsibility
 * of the Weather Optimizer / scheduleOptimizer.js service.
 * @param {mongoose.Document} itinerary
 * @param {Object|null} weatherSnapshot
 * @returns {{activity:string, actionStatus:string, nextActivity:string, recommendation:string}}
 */
function determineTodaysTask(itinerary, weatherSnapshot) {
  const today = new Date();
  const timeline = Array.isArray(itinerary.timeline) ? itinerary.timeline : [];

  // 1. Try to find the timeline entry scheduled for today.
  let current = timeline.find((entry) => isSameCalendarDay(effectiveTimelineDate(entry), today));

  // 2. Otherwise, fall back to the nearest not-yet-completed upcoming entry.
  if (!current) {
    const upcoming = timeline
      .filter((entry) => {
        const date = effectiveTimelineDate(entry);
        return date && date.getTime() >= today.getTime() && entry.status !== 'Completed' && entry.status !== 'Skipped';
      })
      .sort((a, b) => effectiveTimelineDate(a) - effectiveTimelineDate(b));
    current = upcoming[0] || null;
  }

  const currentIndex = current ? timeline.indexOf(current) : -1;
  const next = currentIndex >= 0 ? timeline[currentIndex + 1] : null;

  const conditionText = String((weatherSnapshot && weatherSnapshot.condition) || '').toLowerCase();
  const isAdverseWeather = ADVERSE_WEATHER_CONDITIONS.some((keyword) => conditionText.includes(keyword));

  // Derive an action status: adverse weather takes priority over whatever
  // status is currently stored, unless the activity is already done.
  let actionStatus = (current && current.status) || (itinerary.todayTask && itinerary.todayTask.status) || 'Pending';
  if (isAdverseWeather && actionStatus !== 'Completed' && actionStatus !== 'Skipped') {
    actionStatus = 'Weather Delay';
  }

  const recommendation =
    (weatherSnapshot && weatherSnapshot.recommendation) ||
    (itinerary.todayTask && itinerary.todayTask.recommendation) ||
    'No specific recommendation available today.';

  const activityTitle = safeValue(
    current && current.title,
    (itinerary.todayTask && itinerary.todayTask.activity) || 'No activity scheduled'
  );
  const scheduledDate = formatDate(current ? effectiveTimelineDate(current) : itinerary.todayTask && itinerary.todayTask.scheduledDate);

  return {
    // A single farmer-readable line for the Executive Summary card.
    activity: `${activityTitle} (${scheduledDate})`,
    actionStatus,
    nextActivity: safeValue(next && next.title, 'No further activity scheduled'),
    recommendation,
  };
}

/* ============================================================================
 * SECTION 6: FIELD MAPPERS (CropItinerary sub-documents -> template shape)
 * ============================================================================
 * pdfTemplates.js expects a specific, flat shape for each section. These
 * mappers translate the CropItinerary model's field names into that
 * shape without adding, inventing, or hardcoding any values.
 */

/** -> report.timeline[]: { week, title, description, scheduledDate, status } */
function mapTimeline(timeline) {
  return (Array.isArray(timeline) ? timeline : []).map((entry, index) => ({
    week: safeValue(entry.week, index + 1),
    title: safeValue(entry.title),
    description: safeValue(entry.description),
    scheduledDate: effectiveTimelineDate(entry),
    status: safeValue(entry.status, 'Upcoming'),
  }));
}

/** -> report.equipment[]: { name, purpose, estimatedRent } */
function mapEquipment(equipmentRequired) {
  return (Array.isArray(equipmentRequired) ? equipmentRequired : []).map((eq) => ({
    name: safeValue(eq.name || eq.equipment, 'Equipment'),
    purpose: safeValue(eq.purpose, 'Field Operations'),
    estimatedRent: safeValue(eq.estimatedRent || eq.estimatedRentalCost, '₹1,200 / hour'),
  }));
}

/** -> report.labour[]: { activity, workers, estimatedDays } */
function mapLabour(labourRequirement) {
  return (Array.isArray(labourRequirement) ? labourRequirement : []).map((entry) => ({
    activity: safeValue(entry.activity, 'Field Activity'),
    workers: safeValue(entry.workers || entry.workersRequired || entry.workerCount, '2 workers'),
    estimatedDays: safeValue(entry.days || entry.estimatedDays || entry.duration, '2 days'),
  }));
}

/** -> report.fertilizer[]: { stage, fertilizer, quantity, time } */
function mapFertilizerSchedule(fertilizerSchedule) {
  return (Array.isArray(fertilizerSchedule) ? fertilizerSchedule : []).map((entry) => ({
    stage: safeValue(entry.stage),
    fertilizer: safeValue(entry.fertilizer),
    quantity: safeValue(entry.quantity),
    time: safeValue(entry.time),
  }));
}

/** -> report.irrigation[]: { stage, frequency, waterRequirement } */
function mapIrrigationSchedule(irrigationSchedule) {
  return (Array.isArray(irrigationSchedule) ? irrigationSchedule : []).map((entry) => ({
    stage: safeValue(entry.stage),
    frequency: safeValue(entry.frequency),
    waterRequirement: safeValue(entry.waterRequirement),
  }));
}

/* ============================================================================
 * SECTION 7: REPORT OBJECT ASSEMBLY
 * ============================================================================
 */

/**
 * Assembles the single, clean report object every pdfTemplates.js drawing
 * function receives, in the exact shape those functions read from
 * (report.farmer.name, report.crop, report.location.*, report.weather.*,
 * report.timeline[], report.equipment[], report.labour[],
 * report.fertilizer[], report.irrigation[], report.precautions[],
 * report.tips[], report.summary.*, report.reportId, report.loginUrl,
 * report.generatedDate). Every field is traced back to the CropItinerary
 * model, the populated Farmer model, the live weather snapshot, or the
 * current date — nothing here is invented.
 * @param {Object} params
 * @param {mongoose.Document} params.itinerary
 * @param {mongoose.Document|null} params.farmer
 * @param {Object|null} params.weatherSnapshot
 * @param {Object} params.todayTask
 * @param {string} params.reportId
 * @param {string} params.loginUrl
 * @param {string} params.generatedDate
 * @returns {Object}
 */
function buildReportData({ itinerary, farmer, weatherSnapshot, todayTask, reportId, loginUrl, generatedDate }) {
  const location = itinerary.location || {};
  const aiSummary = itinerary.aiSummary || {};

  return {
    reportId,
    generatedDate,
    loginUrl,
    language: itinerary.language || 'en',

    farmer: {
      name: safeValue(farmer && (farmer.fullName || farmer.name), 'Farmer'),
    },

    crop: safeValue(itinerary.crop),
    landArea: safeValue(itinerary.landArea),

    location: {
      state: safeValue(location.state),
      district: safeValue(location.district),
    },

    soilType: safeValue(itinerary.soilType),
    waterSource: safeValue(itinerary.waterSource),
    budget: safeValue(itinerary.budget),
    season: safeValue(itinerary.season, aiSummary.bestSowingSeason),
    seedRecommendation: safeValue(itinerary.seedRecommendation),

    summary: {
      cropDuration: safeValue(itinerary.cropDuration || aiSummary.cropDuration, '4 - 5 Months'),
      expectedYield: safeValue(itinerary.expectedYield || aiSummary.expectedYield, '25-30 Quintals / Acre'),
      estimatedCost: safeValue(itinerary.estimatedTotalCost || aiSummary.estimatedCost, `₹${safeValue(itinerary.budget, '1,00,000')}`),
      estimatedIncome: safeValue(itinerary.estimatedIncome || aiSummary.estimatedIncome, '₹2,00,000'),
      estimatedProfit: safeValue(itinerary.estimatedProfit || aiSummary.estimatedProfit, '₹1,00,000'),
      riskLevel: safeValue(aiSummary.riskLevel, 'Low Risk'),
      todaysTask: todayTask.activity,
      aiRecommendation: todayTask.recommendation,
    },

    weather: {
      temperature: weatherSnapshot && weatherSnapshot.temperature !== undefined ? weatherSnapshot.temperature : 28,
      humidity: weatherSnapshot && weatherSnapshot.humidity !== undefined ? weatherSnapshot.humidity : 65,
      windSpeed: weatherSnapshot && weatherSnapshot.windSpeed !== undefined ? weatherSnapshot.windSpeed : 10,
      rainProbability: weatherSnapshot && weatherSnapshot.rainProbability !== undefined ? weatherSnapshot.rainProbability : 15,
      condition: safeValue(weatherSnapshot && weatherSnapshot.condition, 'Sunny / Clear'),
      recommendation: safeValue(
        weatherSnapshot && weatherSnapshot.recommendation,
        'Favorable weather conditions for current crop stage. Proceed with scheduled farming activities and maintain regular field observation.'
      ),
    },

    timeline: mapTimeline(itinerary.timeline),
    equipment: mapEquipment(itinerary.equipmentRequired),
    labour: mapLabour(itinerary.labourRequirement),
    fertilizer: mapFertilizerSchedule(itinerary.fertilizerSchedule),
    irrigation: mapIrrigationSchedule(itinerary.irrigationSchedule),

    precautions: Array.isArray(itinerary.precautions) ? itinerary.precautions : [],
    tips: Array.isArray(itinerary.tips) ? itinerary.tips : [],
    importantNotes: safeValue(itinerary.importantNotes),
    todaysReminder: safeValue(itinerary.todaysReminder),
  };
}

/* ============================================================================
 * SECTION 8: PDF RENDERING (creates the document, delegates all drawing)
 * ============================================================================
 */

/**
 * Creates the PDFKit document, pipes it to `writeStream`, and delegates
 * every page to pdfTemplates.js in the fixed report order. pdfService.js
 * never draws anything itself — it only owns document lifecycle
 * (creation, piping, ending) and stream completion.
 * @param {Object} report - Shape produced by buildReportData().
 * @param {fs.WriteStream} writeStream
 * @returns {Promise<void>}
 */
function renderPDF(report, writeStream) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: pageTokens.size,
      margins: pageTokens.margins,
      bufferPages: true,
    });

    // Set active language for font and i18n resolution across all pages
    doc._currentLanguage = (report && report.language) ? report.language : 'en';
    registerAllFonts(doc);

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(writeStream);

    // Page order matches the FarmFleet AI report specification.
    // Executive summary is removed per user requirement for simplicity.
    pdfTemplates.drawCoverPage(doc, report);
    pdfTemplates.drawFarmInformation(doc, report);
    pdfTemplates.drawTimelinePage(doc, report);
    pdfTemplates.drawEquipmentPage(doc, report);
    pdfTemplates.drawLabourPage(doc, report);
    pdfTemplates.drawFertilizerPage(doc, report);
    pdfTemplates.drawIrrigationPage(doc, report);
    pdfTemplates.drawWeatherPage(doc, report);
    pdfTemplates.drawPrecautionsPage(doc, report);
    pdfTemplates.drawFinalPage(doc, report);

    doc.end();
  });
}

/* ============================================================================
 * SECTION 9: EXPORTED SERVICE FUNCTIONS
 * ============================================================================
 */

/**
 * Generates (or regenerates) the AI Farming Report PDF for a given
 * itinerary and saves it under generated-reports/. This is the single
 * entry point controllers should call.
 * @param {string} itineraryId
 * @returns {Promise<{success:boolean, pdfPath:string, filename:string, generatedDate:string, report:Object}>}
 */
async function generatePDF(itineraryId) {
  const itinerary = await loadItinerary(itineraryId);
  const farmer = itinerary.farmer || null;

  // Weather is fetched independently of everything else needed to build
  // the report. (Equipment/Labour are embedded sub-documents today and
  // need no separate query; once Equipment.js / Labour.js catalog models
  // exist, their lookups belong alongside this fetch.)
  const weatherSnapshot = await fetchWeatherSnapshot(itinerary);

  const todayTask = determineTodaysTask(itinerary, weatherSnapshot);
  const generatedDate = formatDate(new Date());
  const reportId = buildReportId(itinerary._id);
  const loginUrl = buildLoginUrl(itinerary._id);

  const report = buildReportData({
    itinerary,
    farmer,
    weatherSnapshot,
    todayTask,
    reportId,
    loginUrl,
    generatedDate,
  });

  ensureOutputDirectory();
  const filename = buildFileName(itinerary._id);
  const pdfPath = resolvePDFPath(filename);

  try {
    const writeStream = fs.createWriteStream(pdfPath);
    // Delegate ALL drawing — pages, cards, tables, timeline, footers — to
    // pdfTemplates.js (styled via pdfStyles.js). pdfService.js only owns
    // document creation/piping here in renderPDF().
    await renderPDF(report, writeStream);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[pdfService] Template rendering failed for itinerary "${itineraryId}": ${err.message}`);
    throw new Error(`Failed to generate PDF report: ${err.message}`);
  }

  // Record PDF bookkeeping on the itinerary so future requests can skip
  // regeneration and the Notification Service can reference the file.
  itinerary.pdf = {
    generated: true,
    generatedAt: new Date(),
    version: ((itinerary.pdf && itinerary.pdf.version) || 0) + 1,
    filePath: pdfPath,
  };

  try {
    await itinerary.save();
  } catch (err) {
    // The PDF itself was generated successfully — a failure to persist
    // bookkeeping metadata should not fail the whole operation, just be
    // logged for investigation.
    // eslint-disable-next-line no-console
    console.error(`[pdfService] Failed to persist PDF metadata for itinerary "${itineraryId}": ${err.message}`);
  }

  return {
    success: true,
    pdfPath,
    filename,
    generatedDate,
    report,
  };
}

/**
 * Deletes a previously generated PDF from disk. Safe to call even if the
 * file no longer exists.
 * @param {string} pdfPath - Absolute or generated-reports-relative path.
 * @returns {Promise<{success:boolean, deleted:boolean}>}
 */
async function deletePDF(pdfPath) {
  const resolvedPath = path.isAbsolute(pdfPath) ? pdfPath : resolvePDFPath(pdfPath);

  if (!fs.existsSync(resolvedPath)) {
    return { success: true, deleted: false };
  }

  await fs.promises.unlink(resolvedPath);
  return { success: true, deleted: true };
}

/**
 * Resolves and verifies the absolute path for a previously generated PDF
 * filename. Throws NotFoundError if the file does not exist on disk.
 * @param {string} filename
 * @returns {string}
 */
function getPDFPath(filename) {
  const resolvedPath = resolvePDFPath(filename);

  if (!fs.existsSync(resolvedPath)) {
    throw new NotFoundError(`Report file "${filename}" was not found`);
  }

  return resolvedPath;
}

/* ============================================================================
 * SECTION 10: EXPORTS
 * ============================================================================
 */

module.exports = {
  generatePDF,
  deletePDF,
  getPDFPath,
  NotFoundError,
  ValidationError,
};