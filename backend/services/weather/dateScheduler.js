// ======================================================
// FarmFleet AI
// Date Scheduler Service
//
// Central scheduling utility: builds farming calendars
// from AI itineraries, applies weather-based delays, and
// keeps the timeline chronologically consistent.
// ======================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/* ======================================================
   Activity Status Constants
========================================================== */

const ACTIVITY_STATUS = Object.freeze({
  SCHEDULED: "Scheduled",
  DELAYED: "Delayed",
  COMPLETED: "Completed",
});

/* ======================================================
   Helper: Convert Mongoose Subdocument or Object to Plain POJO
========================================================== */

const toPlainObject = (obj) => {
  if (!obj) return obj;
  if (typeof obj.toObject === "function") {
    return obj.toObject();
  }
  if (obj._doc) {
    return { ...obj._doc };
  }
  return { ...obj };
};

/* ======================================================
   Week Number Extraction
========================================================== */

const getWeekNumber = (weekString) => {
  if (!weekString || typeof weekString !== "string") return 1;

  const match = weekString.match(/\d+/);
  if (!match) return 1;

  const weekNumber = parseInt(match[0], 10);
  if (!Number.isFinite(weekNumber) || weekNumber < 1) return 1;

  return weekNumber;
};

/* ======================================================
   Add Days To Date
========================================================== */

const addDays = (date, days = 0) => {
  const baseDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(baseDate.getTime())) {
    return new Date();
  }

  const safeDays = Number.isFinite(days) ? days : 0;

  return new Date(baseDate.getTime() + safeDays * MS_PER_DAY);
};

/* ======================================================
   Reset Time
========================================================== */

const resetTime = (date) => {
  const baseDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(baseDate.getTime())) {
    return resetTime(new Date());
  }

  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
};

/* ======================================================
   Format Date
========================================================== */

const formatDate = (date) => {
  const baseDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(baseDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(baseDate);
};

/* ======================================================
   Generate Farming Calendar
========================================================== */

const generateSchedule = (timeline, cultivationStartDate = new Date()) => {
  if (!timeline || !timeline.length) return [];

  return timeline.map((activityItem) => {
    const activity = toPlainObject(activityItem);
    const weekNumber = getWeekNumber(activity.week);

    const scheduledDate = addDays(cultivationStartDate, (weekNumber - 1) * 7);

    return {
      ...activity,

      weekNumber,

      originalDate: scheduledDate,
      currentDate: scheduledDate,
      formattedDate: formatDate(scheduledDate),

      status: ACTIVITY_STATUS.SCHEDULED,

      delayed: false,
      delayDays: 0,

      weatherDecision: null,
    };
  });
};

/* ======================================================
   Delay A Single Activity (Requirement 3)
   Preserves ALL existing activity fields.
========================================================== */

const shiftActivity = (activity, delayDays, reason = "Weather Delay") => {
  if (!activity) return activity;
  const plain = toPlainObject(activity);

  if (!Number.isFinite(delayDays) || delayDays <= 0) return plain;

  const updatedDate = addDays(plain.currentDate, delayDays);

  return {
    ...plain,

    currentDate: updatedDate,
    formattedDate: formatDate(updatedDate),

    delayed: true,
    delayDays: (plain.delayDays || 0) + delayDays,

    status: ACTIVITY_STATUS.DELAYED,
    delayReason: reason,
  };
};

/* ======================================================
   Shift Remaining Activities (Requirement 1)
   Contract: (timeline, startIndex: number, delayDays: number, reason: string)
========================================================== */

const shiftRemainingActivities = (timeline, startIndex, delayDays, reason = "Weather Delay") => {
  if (!Array.isArray(timeline) || !timeline.length) return [];

  if (typeof startIndex !== "number" || startIndex < 0) {
    console.error("[DateScheduler] ERROR | shiftRemainingActivities received non-numeric startIndex:", startIndex);
    return timeline.map((item) => toPlainObject(item));
  }

  return timeline.map((activity, index) => {
    const plain = toPlainObject(activity);
    if (index < startIndex) return plain;
    return shiftActivity(plain, delayDays, reason);
  });
};

/* ======================================================
   Get Upcoming Activities (Requirement 10)
   Compares calendar dates in Asia/Kolkata timezone.
========================================================== */

const getUpcomingActivities = (timeline, days = 7) => {
  if (!Array.isArray(timeline) || !timeline.length) return [];

  const { normalizeDateKey } = require("./weatherService");
  const todayKey = normalizeDateKey(new Date());
  if (!todayKey) return [];

  const [tY, tM, tD] = todayKey.split("-").map(Number);
  const todayUtc = Date.UTC(tY, tM - 1, tD);

  return timeline
    .map((item) => toPlainObject(item))
    .filter((activity) => {
      if (!activity || !activity.currentDate) return false;

      const activityDateKey = normalizeDateKey(activity.currentDate);
      if (!activityDateKey) return false;

      const [aY, aM, aD] = activityDateKey.split("-").map(Number);
      const activityUtc = Date.UTC(aY, aM - 1, aD);

      const dayDifference = Math.round((activityUtc - todayUtc) / MS_PER_DAY);

      return dayDifference >= 0 && dayDifference <= days;
    });
};

/* ======================================================
   Sort Timeline
========================================================== */

const sortTimeline = (timeline) => {
  if (!timeline || !timeline.length) return [];

  return [...timeline]
    .map((item) => toPlainObject(item))
    .sort((a, b) => {
      const dateA = new Date(a.currentDate).getTime();
      const dateB = new Date(b.currentDate).getTime();
      return dateA - dateB;
    });
};

/* ======================================================
   Get Next Activity
========================================================== */

const getNextActivity = (timeline) => {
  if (!timeline || !timeline.length) return null;

  const upcoming = getUpcomingActivities(timeline, 365);
  return upcoming[0] || null;
};

/* ======================================================
   Is Activity Delayed
========================================================== */

const isActivityDelayed = (activity) => {
  if (!activity) return false;
  return Boolean(activity.delayed) || (activity.delayDays || 0) > 0;
};

/* ======================================================
   Exports
========================================================== */

module.exports = {
  generateSchedule,
  shiftActivity,
  shiftRemainingActivities,
  getUpcomingActivities,
  getWeekNumber,
  formatDate,
  addDays,
  toPlainObject,

  resetTime,
  sortTimeline,
  getNextActivity,
  isActivityDelayed,
  ACTIVITY_STATUS,
};