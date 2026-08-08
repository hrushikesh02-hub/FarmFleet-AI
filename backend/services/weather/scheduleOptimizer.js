const { evaluateWeatherRules } = require("./weatherRules");
const { getForecastForActivity } = require("./weatherService");
const { shiftActivity, shiftRemainingActivities, toPlainObject } = require("./dateScheduler");

/* ======================================================
   FarmFleet AI - Schedule Optimizer
   Pure decision engine: analyzes a farming timeline
   against weather data and returns an optimized timeline
   plus structured recommendations.
====================================================== */

const SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

/* ======================================================
   Safe Wrappers
====================================================== */

const safeEvaluateWeatherRules = (forecast, title) => {
  try {
    return evaluateWeatherRules(forecast, title);
  } catch (error) {
    return {
      safe: true,
      severity: SEVERITY.LOW,
      weatherCondition: "Unknown",
      reason: "Weather evaluation failed; safe default used.",
      recommendation: "Continue as planned.",
      action: "Continue as planned.",
      delayDays: 0,
      forecastAvailable: Boolean(forecast),
    };
  }
};

const safeShiftActivity = (activityInput, delayDays, reason) => {
  const activity = toPlainObject(activityInput);
  if (!activity || !delayDays || delayDays <= 0) return activity;

  try {
    const shifted = shiftActivity(activity, delayDays, reason);
    if (!shifted || !shifted.currentDate) {
      console.error("[ScheduleOptimizer] ERROR | shiftActivity returned invalid date", {
        activity: activity?.title,
        delayDays,
      });
      return activity;
    }
    return toPlainObject(shifted);
  } catch (error) {
    console.error("[ScheduleOptimizer] ERROR | shiftActivity failed:", error.message);
    return activity;
  }
};

/* ======================================================
   Build Recommendation (Requirement 8 & 9)
====================================================== */

const buildRecommendation = (decision = {}) => {
  const safe = decision.safe !== false;
  const forecastAvailable = decision.forecastAvailable !== false;

  const action =
    decision.action ||
    decision.recommendation ||
    (safe ? "Continue as planned." : "Delay activity.");

  let severity = decision.severity || (safe ? SEVERITY.LOW : SEVERITY.MEDIUM);
  severity = String(severity).toLowerCase();

  return {
    safe,
    severity,
    weatherCondition: decision.weatherCondition || decision.weather || "Unknown",
    reason:
      decision.reason ||
      (safe ? "Weather conditions are favorable." : "Unfavorable weather conditions."),

    recommendation: action,
    action,

    delayDays: Number.isFinite(decision.delayDays) ? decision.delayDays : 0,
    forecastAvailable,
    riskScore: decision.riskScore || 0,
    warnings: decision.warnings || [],
    recommendations: decision.recommendations || [],
  };
};

/* ======================================================
   Optimize Single Activity (Requirement 4 & 12)
   Preserves ALL existing activity properties.
====================================================== */

const optimizeActivity = (activityInput, weatherReport) => {
  const activity = toPlainObject(activityInput);

  if (!activity) {
    const recommendation = buildRecommendation({
      safe: true,
      reason: "No activity provided.",
      recommendation: "Continue as planned.",
      forecastAvailable: false,
    });

    return {
      activity: null,
      changed: false,
      recommendation,
    };
  }

  const forecast = getForecastForActivity(weatherReport, activity);

  if (!forecast) {
    const recommendation = buildRecommendation({
      safe: true,
      severity: SEVERITY.LOW,
      weatherCondition: "Forecast Unavailable",
      reason: "No weather forecast was available for the scheduled activity date.",
      recommendation: "Review weather conditions before proceeding.",
      action: "Review weather conditions before proceeding.",
      delayDays: 0,
      forecastAvailable: false,
    });

    return {
      activity: {
        ...activity,
        weatherDecision: recommendation,
      },
      changed: false,
      recommendation,
    };
  }

  const decision = safeEvaluateWeatherRules(forecast, activity.title);
  const recommendation = buildRecommendation(decision);

  if (recommendation.safe) {
    return {
      activity: {
        ...activity,
        weatherDecision: recommendation,
      },
      changed: false,
      recommendation,
    };
  }

  const shiftedActivity = safeShiftActivity(
    activity,
    recommendation.delayDays,
    recommendation.reason
  );

  const updatedActivity = {
    ...toPlainObject(shiftedActivity),
    weatherDecision: recommendation,
  };

  return {
    activity: updatedActivity,
    changed: true,
    recommendation,
  };
};

/* ======================================================
   Build Optimization Summary
====================================================== */

const buildOptimizationSummary = (recommendations) => {
  const summary = {
    totalActivities: recommendations.length,
    affectedActivities: 0,
    safeActivities: 0,
    highRiskActivities: 0,
    mediumRiskActivities: 0,
    lowRiskActivities: 0,
  };

  for (const rec of recommendations) {
    if (rec.safe) {
      summary.safeActivities++;
    } else {
      summary.affectedActivities++;
    }

    switch ((rec.severity || "").toLowerCase()) {
      case SEVERITY.HIGH:
        summary.highRiskActivities++;
        break;
      case SEVERITY.MEDIUM:
        summary.mediumRiskActivities++;
        break;
      case SEVERITY.LOW:
        summary.lowRiskActivities++;
        break;
      default:
        break;
    }
  }

  return summary;
};

/* ======================================================
   Optimize Entire Schedule (Requirement 5)
====================================================== */

const optimizeSchedule = (itinerary, weatherReport) => {
  if (!itinerary || !Array.isArray(itinerary.timeline) || !itinerary.timeline.length) {
    return {
      timeline: [],
      recommendations: [],
      changes: 0,
      summary: buildOptimizationSummary([]),
    };
  }

  let timeline = itinerary.timeline.map((item) => toPlainObject(item));
  const recommendations = [];
  let totalChanges = 0;

  for (let i = 0; i < timeline.length; i++) {
    const activity = timeline[i];

    const forecast = getForecastForActivity(weatherReport, activity);

    const decision = forecast
      ? safeEvaluateWeatherRules(forecast, activity.title)
      : {
          safe: true,
          severity: SEVERITY.LOW,
          weatherCondition: "Forecast Unavailable",
          reason: "No weather forecast was available for the scheduled activity date.",
          recommendation: "Review weather conditions before proceeding.",
          action: "Review weather conditions before proceeding.",
          delayDays: 0,
          forecastAvailable: false,
        };

    const recommendation = buildRecommendation(decision);

    if (!recommendation.safe && recommendation.delayDays > 0) {
      timeline = shiftRemainingActivities(
        timeline,
        i,
        recommendation.delayDays,
        recommendation.reason
      );
      totalChanges++;
    }

    timeline[i] = {
      ...toPlainObject(timeline[i]),
      weatherDecision: recommendation,
    };

    const finalActivity = timeline[i];

    recommendations.push({
      activity: finalActivity.title,
      week: finalActivity.week,
      date: finalActivity.currentDate,
      weatherCondition: recommendation.weatherCondition,
      severity: recommendation.severity,
      safe: recommendation.safe,
      delayDays: recommendation.delayDays,
      reason: recommendation.reason,
      recommendation: recommendation.recommendation,
      action: recommendation.action,
      forecastAvailable: recommendation.forecastAvailable,
    });
  }

  return {
    timeline,
    recommendations,
    changes: totalChanges,
    summary: buildOptimizationSummary(recommendations),
  };
};

/* ======================================================
   Export
====================================================== */

module.exports = {
  optimizeActivity,
  optimizeSchedule,
};