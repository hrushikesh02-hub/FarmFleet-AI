// ======================================================
// FarmFleet AI
// Date Scheduler Service
// ======================================================

/**
 * Extracts the first week number from strings like:
 * Week 1
 * Week 5
 * Week 8-9
 * Week 10 to 12
 */

const getWeekNumber = (weekString) => {
  if (!weekString) return 1;

  const match = weekString.match(/\d+/);

  if (!match) return 1;

  return parseInt(match[0]);
};

/**
 * Adds days to a Date object
 */

const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

/**
 * Format Date
 * Example:
 * 2026-08-01
 */

const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * =====================================================
 * Generate Calendar Dates
 * =====================================================
 *
 * @param {Array} timeline
 * @param {Date} startDate
 */

const generateSchedule = (
  timeline,
  startDate = new Date()
) => {

  if (!timeline || timeline.length === 0)
    return [];

  const generatedTimeline = timeline.map((activity) => {

    const week = getWeekNumber(activity.week);

    // Week1 = 0 days
    // Week2 = 7 days
    // Week3 = 14 days

    const activityDate = addDays(
      startDate,
      (week - 1) * 7
    );

    return {

      ...activity,

      originalDate: activityDate,

      currentDate: activityDate,

      status: "Upcoming",

      formattedDate: formatDate(activityDate)

    };

  });

  return generatedTimeline;
};

/**
 * =====================================================
 * Shift Activity
 * =====================================================
 *
 * Used by Weather Engine
 */

const shiftActivity = (
  activity,
  delayDays
) => {

  const newDate = addDays(
    new Date(activity.currentDate),
    delayDays
  );

  return {

    ...activity,

    currentDate: newDate,

    formattedDate: formatDate(newDate),

    status: "Delayed"

  };

};

/**
 * =====================================================
 * Shift Entire Schedule
 * =====================================================
 */

const shiftRemainingActivities = (
  timeline,
  startIndex,
  delayDays
) => {

  return timeline.map((activity, index) => {

    if (index < startIndex)
      return activity;

    return shiftActivity(
      activity,
      delayDays
    );

  });

};

// ======================================================
// Export
// ======================================================

module.exports = {

  generateSchedule,

  shiftActivity,

  shiftRemainingActivities,

  getWeekNumber,

  formatDate,

};