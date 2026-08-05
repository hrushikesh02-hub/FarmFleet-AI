// ======================================================
// Weather Rules Engine
// FarmFleet AI
// ======================================================

/**
 * Evaluates weather conditions for a farming activity.
 *
 * @param {Object} weather
 * @param {String} activity
 * @returns {Object}
 */

const evaluateWeatherRules = (weather, activity) => {
  const weatherType = (weather.weather || "").toLowerCase();

  const temperature = Number(weather.temperature) || 0;

  const humidity = Number(weather.humidity) || 0;

  const windSpeed = Number(weather.windSpeed) || 0;

  const rain = Number(weather.rain) || 0;

  const result = {
    safe: true,

    delayDays: 0,

    severity: "Low",

    message: "Weather conditions are suitable.",

    recommendation: "Proceed with the activity.",

    weatherCondition: weather.weather,
  };

  const currentActivity = activity.toLowerCase();

  // ======================================================
  // Heavy Rain
  // ======================================================

  if (
    weatherType.includes("rain") ||
    rain >= 10
  ) {
    if (
      currentActivity.includes("spray") ||
      currentActivity.includes("pesticide")
    ) {
      result.safe = false;
      result.delayDays = 3;
      result.severity = "High";
      result.message =
        "Heavy rainfall expected. Spraying should be postponed.";
      result.recommendation =
        "Delay spraying by 3 days after rainfall.";
    }

    if (
      currentActivity.includes("harvest")
    ) {
      result.safe = false;
      result.delayDays = 2;
      result.severity = "High";
      result.message =
        "Harvesting during rainfall may damage crops.";
      result.recommendation =
        "Harvest after rain stops.";
    }

    if (
      currentActivity.includes("fertilizer")
    ) {
      result.safe = false;
      result.delayDays = 2;
      result.severity = "Medium";
      result.message =
        "Rain may wash away fertilizer.";
      result.recommendation =
        "Apply fertilizer after rainfall.";
    }
  }

  // ======================================================
  // Strong Wind
  // ======================================================

  if (windSpeed >= 20) {
    if (
      currentActivity.includes("spray")
    ) {
      result.safe = false;
      result.delayDays = 1;
      result.severity = "Medium";
      result.message =
        "Strong winds may cause uneven spraying.";
      result.recommendation =
        "Wait until wind speed decreases.";
    }
  }

  // ======================================================
  // High Temperature
  // ======================================================

  if (temperature >= 40) {
    if (
      currentActivity.includes("irrigation")
    ) {
      result.safe = true;
      result.severity = "Medium";
      result.message =
        "High temperature increases water demand.";
      result.recommendation =
        "Increase irrigation frequency.";
    }

    if (
      currentActivity.includes("labour")
    ) {
      result.safe = true;
      result.severity = "Medium";
      result.message =
        "Avoid working during afternoon heat.";
      result.recommendation =
        "Work early morning or evening.";
    }
  }

  // ======================================================
  // Very High Humidity
  // ======================================================

  if (humidity >= 90) {
    result.severity = "Medium";

    result.message =
      "High humidity increases disease risk.";

    result.recommendation =
      "Monitor crops for fungal diseases.";
  }

  // ======================================================
  // Clear Weather
  // ======================================================

  if (
    weatherType.includes("clear")
  ) {
    result.safe = true;

    result.delayDays = 0;

    result.severity = "Low";

    result.message =
      "Weather is favorable for farming.";

    result.recommendation =
      "Continue as scheduled.";
  }

  return result;
};

// ======================================================
// Export
// ======================================================

module.exports = {
  evaluateWeatherRules,
};