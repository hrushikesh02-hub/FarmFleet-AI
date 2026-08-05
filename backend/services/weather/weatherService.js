const axios = require("axios");

// ======================================================
// OpenWeather Configuration
// ======================================================

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// ======================================================
// Validate API Key
// ======================================================

if (!WEATHER_API_KEY) {
  throw new Error(
    "OPENWEATHER_API_KEY is missing in .env file"
  );
}

// ======================================================
// Get Current Weather
// ======================================================

const getCurrentWeather = async (city) => {
  try {
    console.log("\n====================================");
    console.log("🌤 Fetching Current Weather");
    console.log("City:", city);
    console.log("====================================");

    const response = await axios.get(
      `${WEATHER_BASE_URL}/weather`,
      {
        params: {
          q: city,
          units: "metric",
          appid: WEATHER_API_KEY,
        },
      }
    );

    const data = response.data;

    return {
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

      visibility: data.visibility,

      sunrise: data.sys.sunrise,

      sunset: data.sys.sunset,

      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Current Weather Error");
    console.error("====================================");

    if (error.response) {
      console.error(error.response.data);
    }

    throw new Error("Unable to fetch current weather.");
  }
};

// ======================================================
// Get 5-Day Weather Forecast
// ======================================================

const getWeatherForecast = async (city) => {
  try {
    console.log("\n====================================");
    console.log("🌦 Fetching Weather Forecast");
    console.log("City:", city);
    console.log("====================================");

    const response = await axios.get(
      `${WEATHER_BASE_URL}/forecast`,
      {
        params: {
          q: city,
          units: "metric",
          appid: WEATHER_API_KEY,
        },
      }
    );

    const forecast = response.data.list.map((item) => ({
      date: item.dt_txt,

      temperature: item.main.temp,

      humidity: item.main.humidity,

      weather: item.weather[0].main,

      description: item.weather[0].description,

      windSpeed: item.wind.speed,

      rain:
        item.rain?.["3h"] || 0,

      clouds: item.clouds.all,
    }));

    return forecast;
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Forecast Error");
    console.error("====================================");

    if (error.response) {
      console.error(error.response.data);
    }

    throw new Error("Unable to fetch weather forecast.");
  }
};

// ======================================================
// Combined Weather Report
// ======================================================

const getCompleteWeatherReport = async (city) => {
  const currentWeather =
    await getCurrentWeather(city);

  const forecast =
    await getWeatherForecast(city);

  return {
    currentWeather,
    forecast,
  };
};

// ======================================================
// Export
// ======================================================

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getCompleteWeatherReport,
};