// ======================================================
// FarmFleet AI
// Weather Rules Engine
// Part 1
// ======================================================

/*
 * This module evaluates whether a farming activity
 * should proceed based on weather conditions.
 *
 * Part 1:
 * - Constants
 * - Activity keyword groups
 * - Helper functions
 */

// ======================================================
// Weather Severity
// ======================================================

const SEVERITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// ======================================================
// Activity Keywords
// ======================================================

const ACTIVITY = {

  LAND_PREPARATION: [
    "land",
    "prepare",
    "plough",
    "plowing",
    "tillage",
    "cultivation",
    "field preparation",
  ],

  SOWING: [
    "sowing",
    "seed",
    "seeding",
    "planting",
    "transplant",
    "transplanting",
  ],

  FERTILIZER: [
    "fertilizer",
    "fertiliser",
    "manure",
    "npk",
    "urea",
    "dap",
    "potash",
  ],

  SPRAY: [
    "spray",
    "spraying",
    "pesticide",
    "fungicide",
    "insecticide",
    "herbicide",
    "weedicide",
    "foliar",
  ],

  IRRIGATION: [
    "irrigation",
    "watering",
    "watering crop",
    "drip",
    "sprinkler",
  ],

  HARVEST: [
    "harvest",
    "harvesting",
    "cutting",
    "crop cutting",
  ],

  LABOUR: [
    "labour",
    "worker",
    "manual",
    "manual work",
  ],

};

// ======================================================
// Helper
// Activity Matcher
// ======================================================

const hasKeyword = (
  activity,
  keywords
) => {

  const value =
    (activity || "").toLowerCase();

  return keywords.some((keyword) =>
    value.includes(keyword)
  );

};

// ======================================================
// Create Default Result
// ======================================================

const createResult = (weather) => ({

  safe: true,

  delayDays: 0,

  severity: SEVERITY.LOW,

  riskScore: 0,

  weatherCondition:
    weather.weather || "Unknown",

  reason:
    "Weather conditions are suitable.",

  action:
    "Proceed with the activity.",

  warnings: [],

  recommendations: [],

  forecastAvailable: true,

});

// ======================================================
// Risk Score
// ======================================================

const increaseRisk = (
  result,
  severity
) => {

  switch (severity) {

    case SEVERITY.HIGH:

      result.riskScore += 3;

      break;

    case SEVERITY.MEDIUM:

      result.riskScore += 2;

      break;

    default:

      result.riskScore += 1;

  }

};

// ======================================================
// Update Result
// ======================================================

const applyDecision = (
  result,
  {
    safe = true,
    severity = SEVERITY.LOW,
    delayDays = 0,
    reason,
    action,
  }
) => {

  if (!safe)
    result.safe = false;

  result.delayDays = Math.max(
    result.delayDays,
    delayDays
  );

  if (
    severity === SEVERITY.HIGH ||
    (
      severity === SEVERITY.MEDIUM &&
      result.severity !== SEVERITY.HIGH
    )
  ) {
    result.severity = severity;
  }

  if (reason) {

    result.warnings.push(reason);

  }

  if (action) {

    result.recommendations.push(action);

  }

  increaseRisk(
    result,
    severity
  );

};

// ======================================================
// Finalize Result
// ======================================================

const finalizeResult = (
  result
) => {

  result.reason =
    result.warnings.length
      ? result.warnings.join(" ")
      : "Weather conditions are suitable.";

  result.action =
    result.recommendations.length
      ? result.recommendations.join(" ")
      : "Proceed with the activity.";

  return result;

};

// ======================================================
// FarmFleet AI
// Weather Rules Engine
// Part 2
// ======================================================

/*
 * Part 2:
 * - Weather condition keyword groups
 * - Numeric thresholds
 * - Rain / wind / temperature / humidity / fog /
 *   thunderstorm / hail rule blocks
 * - evaluateWeatherRules() (public entry point)
 */

// ======================================================
// Weather Condition Keywords
// (matched against the text weather description)
// ======================================================

const CONDITION = {

  THUNDERSTORM: [
    "thunderstorm",
    "thunder",
    "lightning",
  ],

  HAIL: [
    "hail",
    "hailstorm",
  ],

  HEAVY_RAIN: [
    "heavy rain",
    "very heavy rain",
    "heavy shower",
  ],

  MODERATE_RAIN: [
    "moderate rain",
  ],

  LIGHT_RAIN: [
    "light rain",
    "drizzle",
    "light shower",
  ],

  RAIN_GENERIC: [
    "rain",
    "shower",
  ],

  STRONG_WIND: [
    "strong wind",
    "gusty wind",
    "high wind",
    "windy",
  ],

  FOG: [
    "fog",
    "mist",
    "haze",
  ],

  CLOUDY: [
    "cloud",
    "overcast",
  ],

  CLEAR: [
    "clear",
    "sunny",
  ],

};

// ======================================================
// Numeric Thresholds
// (used when structured weather fields are available)
// ======================================================

const THRESHOLD = {

  STRONG_WIND_KMH: 30,

  HIGH_TEMP_C: 38,

  LOW_TEMP_C: 10,

  HIGH_HUMIDITY_PCT: 85,

  // Approximate IMD daily rainfall classification
  HEAVY_RAINFALL_MM: 64.5,

  MODERATE_RAINFALL_MM: 15.6,

};

// ======================================================
// Helper
// Weather Description Matcher
// (reuses hasKeyword - it only cares about a string
// and a keyword list, so it works for weather text too)
// ======================================================

const matchesCondition = (
  description,
  keywords
) => hasKeyword(description, keywords);

// ======================================================
// Helper
// Rain Level Detector
// Prefers numeric rainfall (mm) when available,
// falls back to the text description otherwise.
// ======================================================

const getRainLevel = (
  description,
  rainfallMm
) => {

  if (typeof rainfallMm === "number") {

    if (rainfallMm <= 0) return null;

    if (rainfallMm >= THRESHOLD.HEAVY_RAINFALL_MM)
      return "heavy";

    if (rainfallMm >= THRESHOLD.MODERATE_RAINFALL_MM)
      return "moderate";

    return "light";

  }

  if (matchesCondition(description, CONDITION.HEAVY_RAIN))
    return "heavy";

  if (matchesCondition(description, CONDITION.MODERATE_RAIN))
    return "moderate";

  if (matchesCondition(description, CONDITION.LIGHT_RAIN))
    return "light";

  if (matchesCondition(description, CONDITION.RAIN_GENERIC))
    return "moderate";

  return null;

};

// ======================================================
// Rule Block
// Rain
// ======================================================

const applyRainRules = (
  result,
  activity,
  level
) => {

  if (level === "heavy") {

    if (hasKeyword(activity, ACTIVITY.LAND_PREPARATION)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.HIGH,
        delayDays: 2,
        reason: "Heavy rain has left fields waterlogged, making land preparation unsafe.",
        action: "Delay land preparation until the field drains and soil is workable.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SOWING)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.HIGH,
        delayDays: 3,
        reason: "Heavy rain increases the risk of seed rot and waterlogging after sowing.",
        action: "Delay sowing until excess water has drained from the field.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.FERTILIZER)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 2,
        reason: "Heavy rain can wash away applied fertilizer, wasting nutrients.",
        action: "Delay fertilizer application until rain subsides.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SPRAY)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.HIGH,
        delayDays: 2,
        reason: "Heavy rain will wash off sprayed pesticide or fungicide before it can act.",
        action: "Do not spray during heavy rain; reschedule once conditions clear.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.HARVEST)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.HIGH,
        delayDays: 3,
        reason: "Heavy rain increases grain moisture and the risk of crop spoilage during harvest.",
        action: "Delay harvesting until the crop and field have dried sufficiently.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.IRRIGATION)) {
      applyDecision(result, {
        safe: true,
        severity: SEVERITY.LOW,
        delayDays: 0,
        reason: "Heavy rain has already supplied sufficient water to the field.",
        action: "Skip irrigation until soil moisture drops.",
      });
    }

  } else if (level === "moderate") {

    if (hasKeyword(activity, ACTIVITY.LAND_PREPARATION)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 1,
        reason: "Moderate rain makes the soil too wet for effective land preparation.",
        action: "Delay land preparation by a day and recheck field conditions.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SOWING)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 1,
        reason: "Moderate rain can disturb freshly sown seeds and topsoil.",
        action: "Delay sowing by a day until conditions stabilize.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.FERTILIZER)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 1,
        reason: "Moderate rain risks nutrient runoff shortly after fertilizer application.",
        action: "Delay fertilizer application by a day.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SPRAY)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 1,
        reason: "Moderate rain reduces spray adhesion and effectiveness.",
        action: "Delay spraying by a day until rain stops.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.HARVEST)) {
      applyDecision(result, {
        safe: false,
        severity: SEVERITY.MEDIUM,
        delayDays: 2,
        reason: "Moderate rain raises grain moisture and slows harvesting operations.",
        action: "Delay harvesting until the crop dries out.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.IRRIGATION)) {
      applyDecision(result, {
        safe: true,
        severity: SEVERITY.LOW,
        delayDays: 0,
        reason: "Moderate rain reduces the immediate need for irrigation.",
        action: "Reduce or skip irrigation for today.",
      });
    }

  } else if (level === "light") {

    if (hasKeyword(activity, ACTIVITY.SPRAY)) {
      applyDecision(result, {
        safe: true,
        severity: SEVERITY.LOW,
        delayDays: 1,
        reason: "Light rain may dilute or reduce the effectiveness of sprayed chemicals.",
        action: "Consider delaying spraying by a day for best results.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.HARVEST)) {
      applyDecision(result, {
        safe: true,
        severity: SEVERITY.LOW,
        delayDays: 1,
        reason: "Light rain can slightly increase grain moisture during harvest.",
        action: "Consider a short delay to allow the crop to dry.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.IRRIGATION)) {
      applyDecision(result, {
        safe: true,
        severity: SEVERITY.LOW,
        delayDays: 0,
        reason: "Light rain provides some natural moisture to the field.",
        action: "Skip irrigation for today and monitor soil moisture.",
      });
    }

  }

};

// ======================================================
// Rule Block
// Wind
// ======================================================

const applyWindRules = (
  result,
  activity
) => {

  if (hasKeyword(activity, ACTIVITY.SPRAY)) {
    applyDecision(result, {
      safe: false,
      severity: SEVERITY.HIGH,
      delayDays: 1,
      reason: "Strong wind increases spray drift risk and reduces application accuracy.",
      action: "Postpone spraying until wind speeds drop.",
    });
  }

  if (hasKeyword(activity, ACTIVITY.FERTILIZER)) {
    applyDecision(result, {
      safe: true,
      severity: SEVERITY.MEDIUM,
      delayDays: 1,
      reason: "Strong wind can cause uneven fertilizer spread during broadcasting.",
      action: "Delay fertilizer broadcasting or use targeted application methods.",
    });
  }

  if (hasKeyword(activity, ACTIVITY.SOWING)) {
    applyDecision(result, {
      safe: true,
      severity: SEVERITY.MEDIUM,
      delayDays: 1,
      reason: "Strong wind may cause uneven seed distribution during broadcasting.",
      action: "Delay seed broadcasting until wind conditions improve.",
    });
  }

};

// ======================================================
// Rule Block
// Temperature
// ======================================================

const applyTemperatureRules = (
  result,
  activity,
  temperature
) => {

  if (typeof temperature !== "number") return;

  if (temperature >= THRESHOLD.HIGH_TEMP_C) {

    if (hasKeyword(activity, ACTIVITY.LABOUR)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        reason: "High temperature increases heat stress risk for farm workers.",
        action: "Schedule labour-intensive work during early morning or evening hours.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.IRRIGATION)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        reason: "High temperature increases evapotranspiration and water stress on crops.",
        action: "Irrigate during early morning or evening to reduce water loss.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SOWING)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        reason: "High temperature can reduce seed germination rates.",
        action: "Ensure adequate soil moisture before sowing, or wait for cooler conditions.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.SPRAY)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        reason: "High temperature increases evaporation and the risk of leaf scorch from spraying.",
        action: "Avoid spraying during peak afternoon heat; prefer early morning or evening.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.FERTILIZER)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        reason: "High temperature accelerates nitrogen loss from urea and similar fertilizers.",
        action: "Apply fertilizer during cooler hours and irrigate soon after application.",
      });
    }

  }

  if (temperature <= THRESHOLD.LOW_TEMP_C) {

    if (hasKeyword(activity, ACTIVITY.SOWING)) {
      applyDecision(result, {
        severity: SEVERITY.MEDIUM,
        delayDays: 1,
        reason: "Low temperature can slow seed germination and early crop growth.",
        action: "Delay sowing until temperatures rise, or use cold-tolerant varieties.",
      });
    }

    if (hasKeyword(activity, ACTIVITY.LABOUR)) {
      applyDecision(result, {
        severity: SEVERITY.LOW,
        reason: "Low early-morning temperature may affect worker comfort and productivity.",
        action: "Consider starting fieldwork slightly later in the morning.",
      });
    }

  }

};

// ======================================================
// Rule Block
// Humidity
// ======================================================

const applyHumidityRules = (
  result,
  activity,
  humidity
) => {

  if (typeof humidity !== "number") return;

  if (humidity < THRESHOLD.HIGH_HUMIDITY_PCT) return;

  applyDecision(result, {
    severity: SEVERITY.MEDIUM,
    reason: "High humidity increases the risk of fungal and bacterial diseases in standing crops.",
    action: "Monitor the crop closely for disease symptoms and ensure good field drainage.",
  });

  if (hasKeyword(activity, ACTIVITY.HARVEST)) {
    applyDecision(result, {
      severity: SEVERITY.MEDIUM,
      delayDays: 1,
      reason: "High humidity can increase spoilage and mold risk in freshly harvested produce.",
      action: "Ensure the harvested crop is dried and stored properly.",
    });
  }

  if (hasKeyword(activity, ACTIVITY.SPRAY)) {
    applyDecision(result, {
      severity: SEVERITY.LOW,
      reason: "High humidity can reduce the effectiveness of certain fungicide and pesticide applications.",
      action: "Check product-specific guidance for humidity-sensitive treatments.",
    });
  }

};

// ======================================================
// Rule Block
// Fog
// ======================================================

const applyFogRules = (
  result,
  activity
) => {

  if (hasKeyword(activity, ACTIVITY.SPRAY)) {
    applyDecision(result, {
      severity: SEVERITY.MEDIUM,
      delayDays: 1,
      reason: "Fog reduces visibility and can affect spray accuracy and drift control.",
      action: "Wait for the fog to clear before spraying.",
    });
  }

  if (hasKeyword(activity, ACTIVITY.HARVEST)) {
    applyDecision(result, {
      severity: SEVERITY.MEDIUM,
      delayDays: 1,
      reason: "Fog reduces visibility for harvesting machinery and labour.",
      action: "Delay harvesting until visibility improves.",
    });
  }

};

// ======================================================
// Rule Block
// Thunderstorm
// ======================================================

const applyThunderstormRules = (result) => {

  applyDecision(result, {
    safe: false,
    severity: SEVERITY.HIGH,
    delayDays: 2,
    reason: "Thunderstorm conditions pose a lightning and safety risk for outdoor farm operations.",
    action: "Halt all outdoor farming activities until the thunderstorm passes and conditions stabilize.",
  });

};

// ======================================================
// Rule Block
// Hail
// ======================================================

const applyHailRules = (result) => {

  applyDecision(result, {
    safe: false,
    severity: SEVERITY.HIGH,
    delayDays: 3,
    reason: "Hail can cause severe physical damage to crops and poses a safety risk to workers.",
    action: "Postpone all farming activities until conditions stabilize and assess crop damage.",
  });

};

// ======================================================
// Public Entry Point
// evaluateWeatherRules()
// ======================================================

const evaluateWeatherRules = (
  weather,
  activity
) => {

  // Missing weather data should never block farming -
  // fail open with a safe default instead of throwing.
  if (!weather) {

    return {
      safe: true,
      delayDays: 0,
      severity: SEVERITY.LOW,
      riskScore: 0,
      weatherCondition: "Forecast Unavailable",
      reason: "No weather forecast was available for the scheduled activity date.",
      action: "Review weather conditions before proceeding.",
      warnings: [],
      recommendations: [],
      forecastAvailable: false,
    };

  }

  // Normalize once, reuse everywhere below.
  const description = (
    weather.weather ||
    weather.condition ||
    ""
  ).toLowerCase();

  const temperature =
    typeof weather.temperature === "number"
      ? weather.temperature
      : undefined;

  const humidity =
    typeof weather.humidity === "number"
      ? weather.humidity
      : undefined;

  const windSpeed =
    typeof weather.windSpeed === "number"
      ? weather.windSpeed
      : undefined;

  const rainfall =
    typeof weather.rainfall === "number"
      ? weather.rainfall
      : undefined;

  const result = createResult(weather);

  const hasThunderstorm = matchesCondition(
    description,
    CONDITION.THUNDERSTORM
  );

  const hasHail = matchesCondition(
    description,
    CONDITION.HAIL
  );

  const hasFog = matchesCondition(
    description,
    CONDITION.FOG
  );

  const rainLevel = getRainLevel(
    description,
    rainfall
  );

  const hasStrongWind =
    (
      typeof windSpeed === "number" &&
      windSpeed >= THRESHOLD.STRONG_WIND_KMH
    ) ||
    matchesCondition(description, CONDITION.STRONG_WIND);

  // Accumulate every applicable risk - never overwrite.
  if (rainLevel) {
    applyRainRules(result, activity, rainLevel);
  }

  if (hasStrongWind) {
    applyWindRules(result, activity);
  }

  applyTemperatureRules(result, activity, temperature);

  applyHumidityRules(result, activity, humidity);

  if (hasFog) {
    applyFogRules(result, activity);
  }

  if (hasThunderstorm) {
    applyThunderstormRules(result);
  }

  if (hasHail) {
    applyHailRules(result);
  }

  // Only fully "clear" if nothing above raised a warning.
  if (result.warnings.length === 0) {
    result.recommendations.push(
      "Clear weather - ideal conditions for all farm operations."
    );
  }

  return finalizeResult(result);

};

// ======================================================
// Export
// ======================================================

module.exports = {
  evaluateWeatherRules,
};