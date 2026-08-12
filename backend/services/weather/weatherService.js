require("dotenv").config();
const axios = require("axios");

/* ==========================================================
   Configuration
========================================================== */

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

const REQUEST_TIMEOUT = 7000; // 7s, within the 5-8s window
const DEFAULT_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

/* ==========================================================
   Environment Validation
========================================================== */

if (!WEATHER_API_KEY) {
  console.warn(
    "[WeatherService] WARNING: OPENWEATHER_API_KEY is missing in environment. Live weather API calls will use mock fallback."
  );
}

/* ==========================================================
   Axios Instance (single reusable instance)
========================================================== */

const weatherAPI = axios.create({
  baseURL: WEATHER_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  params: {
    appid: WEATHER_API_KEY,
    units: "metric",
  },
});

/* ==========================================================
   Lightweight Structured Logging
========================================================== */

const logEvent = (event, details = {}) => {
  const meta = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(" | ");
  console.log(`[WeatherService] ${event}${meta ? " | " + meta : ""}`);
};

const logError = (event, details = {}) => {
  const meta = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(" | ");
  console.error(`[WeatherService] ERROR | ${event}${meta ? " | " + meta : ""}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================================
   Date Normalization Helper (Requirement 1 & 20)
   Converts supported date representations into a calendar-day
   key: YYYY-MM-DD in Asia/Kolkata timezone.
========================================================== */

const normalizeDateKey = (dateInput) => {
  if (!dateInput) return null;

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match && !trimmed.includes("T")) {
      return match[1];
    }
  }

  let dateObj;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === "string" || typeof dateInput === "number") {
    let str = String(dateInput).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
      str = str.replace(" ", "T");
    }
    dateObj = new Date(str);
  } else {
    return null;
  }

  if (isNaN(dateObj.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(dateObj);
  } catch (e) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
};

/* ==========================================================
   Error Classification
========================================================== */

const classifyError = (error) => {
  if (error.code === "ECONNABORTED") {
    return { message: "OpenWeather request timed out.", retryable: true };
  }

  if (!error.response) {
    return { message: "Network connection failed.", retryable: true };
  }

  const status = error.response.status;

  if (status === 401) {
    return { message: "Invalid API key.", retryable: false };
  }

  if (status === 404) {
    return { message: "City not found.", retryable: false };
  }

  if (status === 400) {
    return {
      message: error.response.data?.message || "Bad request to weather service.",
      retryable: false,
    };
  }

  if (status >= 500) {
    return { message: "Weather service unavailable.", retryable: true };
  }

  return {
    message: error.response.data?.message || "Unable to fetch weather data.",
    retryable: false,
  };
};

const handleWeatherError = (error, context) => {
  const { message, retryable } = classifyError(error);

  logError(context, {
    reason: message,
    status: error.response?.status || "n/a",
  });

  const normalizedError = new Error(message);
  normalizedError.retryable = retryable;
  normalizedError.cause = error;
  throw normalizedError;
};

/* ==========================================================
   Retry Helper
========================================================== */

const withRetry = async (operation, retries = DEFAULT_RETRIES, baseDelay = RETRY_BASE_DELAY_MS) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const canRetry = error.retryable !== false && attempt < retries;
      if (!canRetry) break;

      const delay = baseDelay * 2 ** attempt;
      logEvent("Retrying after transient failure", {
        attempt: attempt + 1,
        delayMs: delay,
        reason: error.message,
      });
      await sleep(delay);
    }
  }

  throw lastError;
};

/* ==========================================================
   City Normalization
========================================================== */

const normalizeCity = (city) => {
  if (!city || typeof city !== "string") return "";

  let normalized = city.trim();
  normalized = normalized.replace(/\([^)]*\)/g, "");
  normalized = normalized.split(",")[0];
  normalized = normalized.replace(/\bdistrict\b/gi, "");
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
};

/* ==========================================================
   Get Raw Date Field (Requirement 3)
========================================================== */

const getForecastItemDateRaw = (item) => {
  if (!item) return null;
  return item.date || item.dt_txt || item.datetime || item.dateTime || (item.dt ? item.dt * 1000 : null);
};

/* ==========================================================
   Normalize Forecast Entry (Requirement 4)
========================================================== */

const normalizeForecastItem = (item) => {
  if (!item) return null;

  const rawDate = getForecastItemDateRaw(item);
  const normalizedDateStr = normalizeDateKey(rawDate);

  const temperature = typeof item.temperature === "number" ? item.temperature : item.main?.temp;
  const feelsLike = typeof item.feelsLike === "number" ? item.feelsLike : (item.main?.feels_like ?? temperature);
  const humidity = typeof item.humidity === "number" ? item.humidity : item.main?.humidity;
  const pressure = typeof item.pressure === "number" ? item.pressure : item.main?.pressure;
  const weather = typeof item.weather === "string" ? item.weather : (item.weather?.[0]?.main || "Unknown");
  const description = typeof item.description === "string" ? item.description : (item.weather?.[0]?.description || weather);
  const windSpeed = typeof item.windSpeed === "number" ? item.windSpeed : item.wind?.speed;
  const clouds = typeof item.clouds === "number" ? item.clouds : item.clouds?.all;

  let rain = 0;
  if (typeof item.rain === "number") {
    rain = item.rain;
  } else if (item.rain && typeof item.rain === "object") {
    rain = item.rain["3h"] || item.rain["1h"] || 0;
  } else if (typeof item.rainfall === "number") {
    rain = item.rainfall;
  }

  return {
    date: rawDate || normalizedDateStr,
    normalizedDate: normalizedDateStr,
    temperature: typeof temperature === "number" ? temperature : 0,
    feelsLike: typeof feelsLike === "number" ? feelsLike : 0,
    humidity: typeof humidity === "number" ? humidity : 0,
    pressure: typeof pressure === "number" ? pressure : 0,
    weather: weather || "Unknown",
    description: description || weather || "Unknown",
    windSpeed: typeof windSpeed === "number" ? windSpeed : 0,
    clouds: typeof clouds === "number" ? clouds : 0,
    rain: typeof rain === "number" ? rain : 0,
    rainfall: typeof rain === "number" ? rain : 0,
  };
};

/* ==========================================================
   Get Current Weather
========================================================== */

const getCurrentWeather = async (city) => {
  try {
    logEvent("Fetching current weather", { city });

    const { data } = await weatherAPI.get("/weather", {
      params: { q: city },
    });

    const result = {
      city: data.name,
      country: data.sys.country,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      weather: data.weather[0].main,
      description: data.weather[0].description,
      clouds: data.clouds.all,
      visibility: data.visibility,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      fetchedAt: new Date().toISOString(),
    };

    logEvent("Current weather fetched", { city: result.city, status: "success" });
    return result;
  } catch (error) {
    handleWeatherError(error, "Current weather fetch failed");
  }
};

/* ==========================================================
   Mock Weather Forecast Data (Requirement 5)
========================================================== */

const getMockForecast = () => {
  return [
    {
      date: "2026-08-07 12:00:00",
      temperature: 28,
      feelsLike: 30,
      humidity: 96,
      pressure: 1002,
      weather: "Heavy Rain",
      description: "Heavy Rain",
      windSpeed: 25,
      clouds: 100,
      rain: 70,
      rainfall: 70,
    },
    {
      date: "2026-08-08 12:00:00",
      temperature: 28,
      feelsLike: 30,
      humidity: 96,
      pressure: 1002,
      weather: "Heavy Rain",
      description: "Heavy Rain",
      windSpeed: 25,
      clouds: 100,
      rain: 70,
      rainfall: 70,
    },
    {
      date: "2026-08-09 12:00:00",
      temperature: 28,
      feelsLike: 30,
      humidity: 96,
      pressure: 1002,
      weather: "Heavy Rain",
      description: "Heavy Rain",
      windSpeed: 25,
      clouds: 100,
      rain: 70,
      rainfall: 70,
    },
    {
      date: "2026-08-10 12:00:00",
      temperature: 28,
      feelsLike: 30,
      humidity: 96,
      pressure: 1002,
      weather: "Heavy Rain",
      description: "Heavy Rain",
      windSpeed: 25,
      clouds: 100,
      rain: 70,
      rainfall: 70,
    },
    {
      date: "2026-08-11 12:00:00",
      temperature: 27,
      feelsLike: 29,
      humidity: 70,
      pressure: 1008,
      weather: "Moderate Rain",
      description: "moderate rain",
      windSpeed: 12,
      clouds: 60,
      rain: 20,
      rainfall: 20,
    },
    {
      date: "2026-08-12 12:00:00",
      temperature: 29,
      feelsLike: 30,
      humidity: 55,
      pressure: 1012,
      weather: "Clear",
      description: "clear sky",
      windSpeed: 5,
      clouds: 10,
      rain: 0,
      rainfall: 0,
    },
    {
      date: "2026-08-13 12:00:00",
      temperature: 30,
      feelsLike: 31,
      humidity: 50,
      pressure: 1013,
      weather: "Clear",
      description: "clear sky",
      windSpeed: 7,
      clouds: 5,
      rain: 0,
      rainfall: 0,
    },
    {
      date: "2026-08-14 12:00:00",
      temperature: 30,
      feelsLike: 31,
      humidity: 50,
      pressure: 1013,
      weather: "Clear",
      description: "clear sky",
      windSpeed: 7,
      clouds: 5,
      rain: 0,
      rainfall: 0,
    },
    {
      date: "2026-08-15 12:00:00",
      temperature: 30,
      feelsLike: 31,
      humidity: 50,
      pressure: 1013,
      weather: "Clear",
      description: "clear sky",
      windSpeed: 7,
      clouds: 5,
      rain: 0,
      rainfall: 0,
    },
  ].map((item) => normalizeForecastItem(item));
};

/* ==========================================================
   Get Weather Forecast (Requirement 5 & 19)
========================================================== */

const getWeatherForecast = async (city) => {
  if (process.env.USE_MOCK_WEATHER === "true") {
    logEvent("Using mocked weather forecast", { city });
    return getMockForecast();
  }

  try {
    logEvent("Fetching forecast from OpenWeather", { city });
    const { data } = await weatherAPI.get("/forecast", {
      params: { q: city },
    });

    if (!data || !Array.isArray(data.list)) {
      return getMockForecast();
    }

    return data.list.map((item) => normalizeForecastItem(item));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      logEvent("OpenWeather forecast failed, using mock forecast", { city, reason: error.message });
      return getMockForecast();
    }
    handleWeatherError(error, "Forecast fetch failed");
  }
};

/* ==========================================================
   Complete Weather Report
========================================================== */

const getCompleteWeatherReport = async (city) => {
  logEvent("Building complete weather report", { city });

  const [currentWeather, forecast] = await Promise.all([
    getCurrentWeather(city),
    getWeatherForecast(city),
  ]);

  return {
    city,
    generatedAt: new Date().toISOString(),
    currentWeather,
    forecast,
  };
};

/* ==========================================================
   Safe Variants
========================================================== */

const getSafeCurrentWeather = async (city) => {
  const normalized = normalizeCity(city);
  return withRetry(() => getCurrentWeather(normalized));
};

const getSafeForecast = async (city) => {
  const normalized = normalizeCity(city);
  return withRetry(() => getWeatherForecast(normalized));
};

const getSafeWeatherReport = async (city) => {
  const normalized = normalizeCity(city);
  return withRetry(() => getCompleteWeatherReport(normalized));
};

/* ==========================================================
   Forecast Selection by Calendar Date (Requirement 2)
========================================================== */

const getForecastForDate = (forecast, targetDate) => {
  if (!Array.isArray(forecast) || !forecast.length || !targetDate) {
    return null;
  }

  const targetDateKey = normalizeDateKey(targetDate);
  if (!targetDateKey) return null;

  const sameDayEntries = forecast.filter((item) => {
    const rawDate = getForecastItemDateRaw(item);
    const itemDateKey = item.normalizedDate || normalizeDateKey(rawDate);
    return itemDateKey === targetDateKey;
  });

  if (!sameDayEntries.length) return null;

  const normalizedEntries = sameDayEntries.map((item) => normalizeForecastItem(item));

  if (normalizedEntries.length === 1) return normalizedEntries[0];

  const noonTarget = new Date(`${targetDateKey}T12:00:00`).getTime();

  return normalizedEntries.reduce((closest, item) => {
    const rawStr = String(item.date).replace(" ", "T");
    const itemTime = new Date(rawStr).getTime();
    const closestRawStr = String(closest.date).replace(" ", "T");
    const closestTime = new Date(closestRawStr).getTime();

    if (isNaN(itemTime)) return closest;
    if (isNaN(closestTime)) return item;

    return Math.abs(itemTime - noonTarget) < Math.abs(closestTime - noonTarget) ? item : closest;
  });
};

/* ==========================================================
   Forecast For Next N Days
========================================================== */

const getForecastForNextDays = (forecast, days = 7) => {
  if (!Array.isArray(forecast) || !forecast.length) return [];

  const today = new Date();
  const results = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayForecast = getForecastForDate(forecast, date);
    if (dayForecast) results.push(dayForecast);
  }

  return results;
};

/* ==========================================================
   Forecast For Activity (Requirement 7 & 18)
========================================================== */

const getForecastForActivity = (weatherReport, activity) => {
  if (!weatherReport || !Array.isArray(weatherReport.forecast)) {
    console.log("❌ No forecast array available");
    return null;
  }

  if (!activity || !activity.currentDate) {
    console.log("❌ Activity/currentDate missing");
    return null;
  }

  const activityDateKey = normalizeDateKey(activity.currentDate);

  console.log("\n========== FORECAST DEBUG ==========");
  console.log("Activity:", activity.title);
  console.log("Activity currentDate:", activity.currentDate);
  console.log("Activity date key:", activityDateKey);

  console.log(
    "Available forecast dates:",
    weatherReport.forecast.map((item) => ({
      date: item.date,
      normalizedDate: item.normalizedDate,
      weather: item.weather,
      rain: item.rain,
      humidity: item.humidity,
      windSpeed: item.windSpeed,
    }))
  );

  const matchedForecast = getForecastForDate(
    weatherReport.forecast,
    activity.currentDate
  );

  if (!matchedForecast) {
    console.log("❌ NO FORECAST MATCH FOUND");
    console.log("Target date:", activityDateKey);
    console.log("====================================\n");
    return null;
  }

  console.log("✅ FORECAST MATCH FOUND");
  console.log("Matched date:", matchedForecast.normalizedDate);
  console.log("Weather:", matchedForecast.weather);
  console.log("Description:", matchedForecast.description);
  console.log("Temperature:", matchedForecast.temperature);
  console.log("Humidity:", matchedForecast.humidity);
  console.log("Wind:", matchedForecast.windSpeed);
  console.log("Rain:", matchedForecast.rain);
  console.log("====================================\n");

  return matchedForecast;
};

/* ==========================================================
   Weather Summary
========================================================== */

const buildWeatherSummary = (current) => {
  if (!current) return null;

  return {
    temperature: current.temperature,
    humidity: current.humidity,
    weather: current.weather,
    windSpeed: current.windSpeed,
    recommendation: "Use Weather Rules Engine for activity-based recommendations.",
    fetchedAt: current.fetchedAt,
  };
};

/* ==========================================================
   Weather Availability Check
========================================================== */

const isWeatherAvailable = (weather) => {
  return Boolean(
    weather &&
    typeof weather.temperature === "number" &&
    typeof weather.humidity === "number" &&
    typeof weather.weather === "string" &&
    weather.weather.length > 0
  );
};

/* ==========================================================
   Exports
========================================================== */

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getCompleteWeatherReport,

  getSafeCurrentWeather,
  getSafeForecast,
  getSafeWeatherReport,

  getForecastForDate,
  getForecastForActivity,
  getForecastForNextDays,

  buildWeatherSummary,
  normalizeCity,

  isWeatherAvailable,
  normalizeDateKey,
  normalizeForecastItem,
};