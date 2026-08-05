const { evaluateWeatherRules } = require("./weatherRules");

// ======================================================
// Add Days to Date
// ======================================================

const addDays = (date, days) => {
  const newDate = new Date(date);

  newDate.setDate(newDate.getDate() + days);

  return newDate;
};

// ======================================================
// Optimize Farming Schedule
// ======================================================

const optimizeSchedule = (
  itinerary,
  weatherReport
) => {
  console.log("\n======================================");
  console.log("🌦 Optimizing Farming Schedule");
  console.log("======================================");

  if (!itinerary.timeline || itinerary.timeline.length === 0) {
    return itinerary;
  }

  const updatedTimeline = itinerary.timeline.map((activity) => {
    // If dates are not assigned yet, skip optimization
    if (!activity.currentDate) {
      return {
        ...activity,
        weatherDecision: {
          safe: true,
          message:
            "Weather optimization will begin after calendar dates are generated.",
        },
      };
    }

    // Find nearest forecast for activity date
    const forecast = weatherReport.forecast.find((item) => {
      const forecastDate = new Date(item.date)
        .toISOString()
        .split("T")[0];

      const activityDate = new Date(activity.currentDate)
        .toISOString()
        .split("T")[0];

      return forecastDate === activityDate;
    });

    // No forecast available
    if (!forecast) {
      return {
        ...activity,
        weatherDecision: {
          safe: true,
          message:
            "No forecast available for this date.",
        },
      };
    }

    // Evaluate weather rules
    const decision = evaluateWeatherRules(
      forecast,
      activity.title
    );

    let newDate = activity.currentDate;

    if (!decision.safe && decision.delayDays > 0) {
      newDate = addDays(
        activity.currentDate,
        decision.delayDays
      );
    }

    return {
      ...activity,

      currentDate: newDate,

      status: decision.safe
        ? "Upcoming"
        : "Delayed",

      weatherDecision: decision,
    };
  });

  return {
    ...itinerary,
    timeline: updatedTimeline,
    lastWeatherCheck: new Date(),
  };
};

// ======================================================
// Export
// ======================================================

module.exports = {
  optimizeSchedule,
};