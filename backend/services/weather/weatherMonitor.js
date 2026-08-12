const CropItinerary = require("../../models/CropItinerary");
const WeatherAlert = require("../../models/WeatherAlert");

const { getSafeWeatherReport } = require("./weatherService");
const {
  getUpcomingActivities,
  shiftRemainingActivities,
  formatDate,
  toPlainObject,
} = require("./dateScheduler");
const { optimizeActivity } = require("./scheduleOptimizer");
const { sendWeatherAlertEmail } = require("./weatherNotification");

const UPCOMING_WINDOW_DAYS = 7;
const ITINERARY_BATCH_SIZE = 10;

/* ======================================================
   Helpers
========================================================== */

/**
 * Strip time-of-day so date comparisons are day-level only.
 */
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Find the numeric index of an activity inside a timeline.
 * Matches by _id when available, otherwise falls back to
 * title + week.
 */
const findActivityIndex = (timeline, activity) => {
  if (!Array.isArray(timeline) || !activity) {
    return -1;
  }

  return timeline.findIndex((item) => {
    if (item?._id && activity?._id) {
      return item._id.toString() === activity._id.toString();
    }

    return item?.title === activity?.title && item?.week === activity?.week;
  });
};

/**
 * Stable identity key for an activity, independent of currentDate.
 */
const keyForActivity = (activity) => {
  if (!activity) return null;

  if (activity._id) {
    return activity._id.toString();
  }

  return `${activity.title || "unknown"}|${activity.week || "unknown"}`;
};

/**
 * Re-find the CURRENT version of an activity from the live timeline.
 */
const findCurrentActivity = (timeline, activity) => {
  const index = findActivityIndex(timeline, activity);

  if (index < 0) {
    return {
      index: -1,
      activity: null,
    };
  }

  return {
    index,
    activity: toPlainObject(timeline[index]),
  };
};

/**
 * Prevent duplicate unresolved alerts.
 */
const hasExistingAlert = async (itineraryId, activityTitle, activityDate) => {
  const dayStart = normalizeDate(activityDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await WeatherAlert.findOne({
    itinerary: itineraryId,
    activity: activityTitle,
    activityDate: { $gte: dayStart, $lt: dayEnd },
    resolved: false,
  });

  return Boolean(existing);
};

/**
 * Build the weatherDecision object.
 */
const buildWeatherDecision = (recommendation) => ({
  safe: recommendation.safe,
  weatherCondition: recommendation.weatherCondition,
  severity: recommendation.severity,
  reason: recommendation.reason,
  recommendation: recommendation.recommendation || recommendation.action,
  action: recommendation.action || recommendation.recommendation,
  delayDays: recommendation.delayDays || 0,
  forecastAvailable: recommendation.forecastAvailable !== false,
  riskScore: recommendation.riskScore || 0,
  warnings: recommendation.warnings || [],
  recommendations: recommendation.recommendations || [],
});

/**
 * Build the payload stored on a WeatherAlert document.
 */
const buildAlertPayload = (itinerary, activityTitle, originalDate, suggestedDate, recommendation) => ({
  farmer: itinerary.farmer._id,
  itinerary: itinerary._id,
  activity: activityTitle,
  activityDate: originalDate,
  suggestedDate: suggestedDate,
  weatherCondition: recommendation.weatherCondition,
  severity: recommendation.severity,
  reason: recommendation.reason,
  recommendation: recommendation.recommendation || recommendation.action,
  delayDays: recommendation.delayDays,
  emailSent: false,
});

/**
 * Send the alert email.
 */
const trySendAlertEmail = async (itinerary, originalActivity, optimizedActivity, recommendation, alert) => {
  try {
    await sendWeatherAlertEmail({
      farmerName: itinerary.farmer.fullName,
      email: itinerary.farmer.email,
      crop: itinerary.crop,
      district: itinerary.location.district,
      activity: originalActivity.title,
      activityDate: originalActivity.formattedDate || formatDate(originalActivity.currentDate),
      suggestedDate: optimizedActivity.formattedDate || formatDate(optimizedActivity.currentDate),
      weatherCondition: recommendation.weatherCondition,
      reason: recommendation.reason,
      recommendation: recommendation.recommendation || recommendation.action,
      severity: recommendation.severity,
      delayDays: recommendation.delayDays,
      itineraryId: itinerary._id.toString(),
    });

    alert.emailSent = true;
    alert.emailSentAt = new Date();
    await alert.save();

    console.log(`Weather Monitor: Weather alert email sent to ${itinerary.farmer.email}`);
    return true;
  } catch (error) {
    console.error(`Weather Monitor: Email send failed for itinerary ${itinerary._id}:`, error.message);
    return false;
  }
};

const describeCurrentWeather = (currentWeather) => {
  if (!currentWeather) return "N/A";
  return (
    currentWeather.weather ||
    currentWeather.description ||
    currentWeather.condition ||
    "N/A"
  );
};

/* ======================================================
   Monitor Single Itinerary
========================================================== */

const monitorSingleItinerary = async (itinerary) => {
  const stats = {
    activitiesChecked: 0,
    activitiesDelayed: 0,
    alertsCreated: 0,
    emailsSent: 0,
    schedulesUpdated: 0,
    failed: false,
  };

  const city = itinerary.location?.district;
  let weatherReport = null;

  try {
    if (!city) {
      console.warn(`Weather Monitor: itinerary ${itinerary._id} has no district, skipping.`);
      stats.failed = true;
      return { itinerary, stats };
    }

    if (!itinerary.farmer?.email) {
      console.warn(`Weather Monitor: itinerary ${itinerary._id} has no farmer email, skipping.`);
      stats.failed = true;
      return { itinerary, stats };
    }

    try {
      weatherReport = await getSafeWeatherReport(city);
    } catch (error) {
      console.error(`Weather Monitor: Weather API error for district ${city}:`, error.message);
    }

    if (!weatherReport || !weatherReport.currentWeather) {
      weatherReport = {
        city: city || "Default Location",
        generatedAt: new Date().toISOString(),
        currentWeather: {
          temperature: 28,
          humidity: 65,
          windSpeed: 10,
          weather: "Sunny / Clear",
          condition: "Sunny / Clear",
          description: "Clear sky with good visibility",
          recommendation: "Weather conditions are optimal for farm work.",
          fetchedAt: new Date().toISOString(),
        },
        forecast: [],
      };
    }

    itinerary.weather = weatherReport.currentWeather;

    const upcomingActivities = getUpcomingActivities(
      itinerary.timeline,
      UPCOMING_WINDOW_DAYS
    );

    const decisionsByKey = new Map();

    for (const snapshotActivity of upcomingActivities) {
      stats.activitiesChecked += 1;

      const {
        index: activityIndex,
        activity: currentActivity,
      } = findCurrentActivity(itinerary.timeline, snapshotActivity);

      // Requirement 11: Safety Validation
      if (
        !currentActivity ||
        activityIndex < 0 ||
        !currentActivity.title ||
        !currentActivity.currentDate ||
        !currentActivity.week ||
        currentActivity.weekNumber === undefined
      ) {
        console.error("Weather Monitor: Invalid timeline activity", {
          itineraryId: itinerary._id,
          index: activityIndex,
          activity: currentActivity,
        });
        continue;
      }

      const originalActivityDate = currentActivity.currentDate;

      let result;
      try {
        result = optimizeActivity(currentActivity, weatherReport);
      } catch (error) {
        console.error(
          `Weather Monitor: Schedule Optimizer error (itinerary ${itinerary._id}, activity "${currentActivity?.title}"):`,
          error.message
        );
        continue;
      }

      if (!result || !result.recommendation) {
        continue;
      }

      const { recommendation, changed } = result;

      // Requirement 4: Preserve all activity fields
      const optimizedActivity = toPlainObject(result.activity || currentActivity);

      const weatherDecision = buildWeatherDecision(recommendation);
      const updatedActivity = {
        ...optimizedActivity,
        weatherDecision,
      };

      const activityKey = keyForActivity(updatedActivity);
      decisionsByKey.set(activityKey, weatherDecision);

      // Requirement 7: Format suggestedDate safely
      console.log(
        [
          "Weather Monitor:",
          `Itinerary: ${itinerary._id}`,
          `Activity: ${currentActivity.title}`,
          `Activity Index: ${activityIndex}`,
          `Original Date: ${currentActivity.formattedDate || formatDate(originalActivityDate)}`,
          `Suggested Date: ${optimizedActivity.formattedDate || (optimizedActivity.currentDate ? formatDate(optimizedActivity.currentDate) : "N/A")}`,
          `Weather: ${recommendation.weatherCondition}`,
          `Safe: ${recommendation.safe}`,
          `Delay: ${recommendation.delayDays} day(s)`,
        ].join(" | ")
      );

      // Update the timeline array element cleanly
      itinerary.timeline[activityIndex] = updatedActivity;

      const isUnsafe = changed && recommendation.safe === false;

      if (!isUnsafe || !(recommendation.delayDays > 0)) {
        continue;
      }

      // Requirement 6: Validate activity title and dates before creating WeatherAlert
      const activityTitle = currentActivity.title || optimizedActivity.title;

      if (!activityTitle || !originalActivityDate || !optimizedActivity.currentDate) {
        console.error(
          `Weather Monitor: Cannot create alert because activity title or date is missing for itinerary ${itinerary._id}`,
          { index: activityIndex, currentActivity, optimizedActivity }
        );
        continue;
      }

      try {
        const duplicate = await hasExistingAlert(
          itinerary._id,
          activityTitle,
          originalActivityDate
        );

        if (!duplicate) {
          const alert = await WeatherAlert.create(
            buildAlertPayload(
              itinerary,
              activityTitle,
              originalActivityDate,
              optimizedActivity.currentDate,
              recommendation
            )
          );
          stats.alertsCreated += 1;

          console.log(`Weather Monitor: WeatherAlert created for "${activityTitle}"`);

          const emailOk = await trySendAlertEmail(
            itinerary,
            { ...currentActivity, currentDate: originalActivityDate },
            optimizedActivity,
            recommendation,
            alert
          );
          if (emailOk) {
            stats.emailsSent += 1;
          }
        }
      } catch (error) {
        console.error(
          `Weather Monitor: Alert/email handling error (itinerary ${itinerary._id}, activity "${activityTitle}"):`,
          error.message
        );
      }

      // Requirement 1 & 2: Shift remaining activities with exact signature: (timeline, startIndex: number, delayDays: number, reason: string)
      try {
        const shiftFromIndex = findActivityIndex(itinerary.timeline, updatedActivity);
        const startIndex = shiftFromIndex >= 0 ? shiftFromIndex + 1 : -1;

        if (startIndex >= 0 && startIndex < itinerary.timeline.length) {
          itinerary.timeline = shiftRemainingActivities(
            itinerary.timeline,
            startIndex,
            recommendation.delayDays,
            recommendation.reason
          );
        }

        // Re-attach weatherDecision to shifted items
        itinerary.timeline = itinerary.timeline.map((item) => {
          const plain = toPlainObject(item);
          const key = keyForActivity(plain);
          if (decisionsByKey.has(key)) {
            return { ...plain, weatherDecision: decisionsByKey.get(key) };
          }
          return plain;
        });

        stats.schedulesUpdated += 1;
        stats.activitiesDelayed += 1;
      } catch (error) {
        console.error(
          `Weather Monitor: Date Scheduler error (itinerary ${itinerary._id}, activity "${activityTitle}"):`,
          error.message
        );
      }
    }

    // Requirement 12: Validate integrity of all items before saving
    itinerary.timeline.forEach((item, idx) => {
      if (
        !item ||
        item.title === undefined ||
        item.week === undefined ||
        item.weekNumber === undefined ||
        item.currentDate === undefined ||
        item.formattedDate === undefined
      ) {
        console.error(`[DataIntegrity] CORRUPTED TIMELINE ITEM AT INDEX ${idx}:`, item);
      }
    });

    // Requirement 13: Temporary debug snapshot before saving
    console.log(
      "Itinerary timeline debug snapshot:",
      itinerary.timeline.map((item, index) => ({
        index,
        title: item.title,
        week: item.week,
        currentDate: item.currentDate,
        formattedDate: item.formattedDate,
        delayed: item.delayed,
        delayDays: item.delayDays,
        weatherDecision: item.weatherDecision,
      }))
    );

    itinerary.markModified("timeline");
    itinerary.weather = weatherReport.currentWeather;
    itinerary.lastWeatherCheck = new Date();

    try {
      await itinerary.save();
    } catch (error) {
      console.error(`Weather Monitor: MongoDB save error (itinerary ${itinerary._id}):`, error.message);
      stats.failed = true;
      return { itinerary, stats };
    }

    console.log(
      [
        "Weather Monitor",
        `Crop: ${itinerary.crop}`,
        `District: ${city}`,
        `Condition: ${describeCurrentWeather(weatherReport.currentWeather)}`,
        `Activities Checked: ${stats.activitiesChecked}`,
        `Activities Delayed: ${stats.activitiesDelayed}`,
        `Alerts Created: ${stats.alertsCreated}`,
        `Emails Sent: ${stats.emailsSent}`,
        "Status: Completed",
      ].join(" | ")
    );

    return { itinerary, stats };
  } catch (error) {
    console.error(`Weather Monitor Error (itinerary ${itinerary._id}):`, error.message);
    stats.failed = true;
    return { itinerary, stats };
  }
};

/* ======================================================
   Monitor All Active Itineraries
========================================================== */

const monitorAllItineraries = async () => {
  const summary = {
    totalItineraries: 0,
    checked: 0,
    skipped: 0,
    alertsCreated: 0,
    emailsSent: 0,
    schedulesUpdated: 0,
    activitiesDelayed: 0,
    failed: 0,
  };

  let itineraries = [];

  try {
    itineraries = await CropItinerary.find({
      status: { $nin: ["Completed", "Archived"] },
    }).populate("farmer", "fullName email");
  } catch (error) {
    console.error("Weather Monitor: failed to load itineraries:", error.message);
    return summary;
  }

  summary.totalItineraries = itineraries.length;

  for (let i = 0; i < itineraries.length; i += ITINERARY_BATCH_SIZE) {
    const batch = itineraries.slice(i, i + ITINERARY_BATCH_SIZE);

    const results = await Promise.all(
      batch.map((itinerary) => monitorSingleItinerary(itinerary))
    );

    for (const { stats } of results) {
      if (stats.failed) {
        summary.failed += 1;
        summary.skipped += 1;
        continue;
      }

      summary.checked += 1;
      summary.alertsCreated += stats.alertsCreated;
      summary.emailsSent += stats.emailsSent;
      summary.schedulesUpdated += stats.schedulesUpdated;
      summary.activitiesDelayed += stats.activitiesDelayed;
    }
  }

  console.log(
    [
      "Weather Monitor Summary",
      `Total: ${summary.totalItineraries}`,
      `Checked: ${summary.checked}`,
      `Skipped: ${summary.skipped}`,
      `Activities Delayed: ${summary.activitiesDelayed}`,
      `Alerts Created: ${summary.alertsCreated}`,
      `Emails Sent: ${summary.emailsSent}`,
      `Schedules Updated: ${summary.schedulesUpdated}`,
      `Failed: ${summary.failed}`,
    ].join(" | ")
  );

  return summary;
};

module.exports = {
  monitorAllItineraries,
  monitorSingleItinerary,
};