const CropItinerary = require("../models/CropItinerary");

const {
  getCurrentWeather,
  getCompleteWeatherReport,
} = require("../services/weather/weatherService");

const {
  generateSchedule,
} = require("../services/weather/dateScheduler");

const {
  optimizeSchedule,
} = require("../services/weather/scheduleOptimizer");

/* =====================================================
   Get Current Weather
   GET /api/weather/current?city=Ahmednagar
===================================================== */

exports.getCurrentWeather = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City query parameter is required.",
      });
    }

    const weather = await getCurrentWeather(city);

    return res.status(200).json({
      success: true,
      weather,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Current Weather Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Complete Weather Report
   GET /api/weather/report?city=Ahmednagar
===================================================== */

exports.getWeatherReport = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City query parameter is required.",
      });
    }

    const report = await getCompleteWeatherReport(city);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Weather Report Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Check Weather & Optimize Itinerary
   POST /api/weather/check/:id
===================================================== */

exports.checkWeatherForItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await CropItinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Crop itinerary not found.",
      });
    }

    const city = itinerary.location?.district;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "District not found in itinerary.",
      });
    }

    const weatherReport =
      await getCompleteWeatherReport(city);

    // Generate dates if missing
    const hasDates = itinerary.timeline.every(
      (item) => item.currentDate
    );

    if (!hasDates) {
      itinerary.timeline = generateSchedule(
        itinerary.timeline,
        new Date()
      );
    }

    // Optimize using weather
    const optimized = optimizeSchedule(
      itinerary.toObject(),
      weatherReport
    );

    itinerary.timeline = optimized.timeline;
    itinerary.lastWeatherCheck = new Date();

    // Save latest weather snapshot
    itinerary.weather = weatherReport.currentWeather;

    await itinerary.save();

    return res.status(200).json({
      success: true,
      message: "Weather analysis completed successfully.",
      weather: weatherReport.currentWeather,
      itinerary,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Weather Optimization Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Refresh Weather
   GET /api/weather/current/:id
===================================================== */

exports.refreshWeather = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await CropItinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Crop itinerary not found.",
      });
    }

    const city = itinerary.location?.district;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "District not found in itinerary.",
      });
    }

    const weather =
      await getCompleteWeatherReport(city);

    itinerary.weather = weather.currentWeather;
    itinerary.lastWeatherCheck = new Date();

    await itinerary.save();

    return res.status(200).json({
      success: true,
      weather,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Refresh Weather Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Update Weather Optimized Schedule
   POST /api/weather/update/:id
===================================================== */

exports.updateWeatherSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await CropItinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Crop itinerary not found.",
      });
    }

    const city = itinerary.location?.district;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "District not found in itinerary.",
      });
    }

    const weather =
      await getCompleteWeatherReport(city);

    const optimized = optimizeSchedule(
      itinerary.toObject(),
      weather
    );

    itinerary.timeline = optimized.timeline;
    itinerary.weather = weather.currentWeather;
    itinerary.lastWeatherCheck = new Date();

    await itinerary.save();

    return res.status(200).json({
      success: true,
      message: "Weather schedule updated successfully.",
      weather: weather.currentWeather,
      itinerary,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ Update Schedule Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};