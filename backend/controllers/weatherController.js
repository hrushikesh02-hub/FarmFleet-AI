const CropItinerary = require("../models/CropItinerary");
const WeatherAlert = require("../models/WeatherAlert");

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

const {
  monitorSingleItinerary,
} = require("../services/weather/weatherMonitor");

/* ===========================================================
   GET CURRENT WEATHER
   GET /api/weather/current?city=Ahmednagar
=========================================================== */

exports.getCurrentWeather = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    const weather = await getCurrentWeather(city);

    return res.status(200).json({
      success: true,
      weather,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================================
   GET COMPLETE WEATHER REPORT
   GET /api/weather/report?city=Ahmednagar
=========================================================== */

exports.getWeatherReport = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    const report =
      await getCompleteWeatherReport(city);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================================
   CHECK WEATHER FOR ONE ITINERARY
   POST /api/weather/check/:id
=========================================================== */

exports.checkWeatherForItinerary =
  async (req, res) => {
    try {
      const itinerary = await CropItinerary.findById(req.params.id)
    .populate("farmer", "fullName email");

      if (!itinerary) {
        return res.status(404).json({
          success: false,
          message: "Itinerary not found.",
        });
      }

      if (
        itinerary.farmer._id.toString() !==
        req.farmer._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (
        !itinerary.timeline ||
        itinerary.timeline.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Timeline not available.",
        });
      }

      const hasDates =
        itinerary.timeline.every(
          (item) => item.currentDate
        );

      if (!hasDates) {
        itinerary.timeline =
          generateSchedule(
            itinerary.timeline,
            new Date()
          );

        await itinerary.save();
      }

      const updated =
        await monitorSingleItinerary(
          itinerary
        );

      return res.status(200).json({
        success: true,
        message:
          "Weather analysed successfully.",
        itinerary: updated,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ===========================================================
   FORCE UPDATE WEATHER SCHEDULE
   POST /api/weather/update/:id
=========================================================== */

exports.updateWeatherSchedule =
  async (req, res) => {
    try {
      const itinerary =
        await CropItinerary.findById(req.params.id);

      if (!itinerary) {
        return res.status(404).json({
          success: false,
          message: "Itinerary not found.",
        });
      }

      const weather =
        await getCompleteWeatherReport(
          itinerary.location.district
        );

      const optimized =
        optimizeSchedule(
          itinerary,
          weather
        );

      itinerary.timeline =
        optimized.timeline;

      itinerary.weather =
        weather.currentWeather;

      itinerary.lastWeatherCheck =
        new Date();

      await itinerary.save();

      return res.status(200).json({
        success: true,
        message:
          "Schedule updated successfully.",
        itinerary,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ===========================================================
   GET MY WEATHER ALERTS
   GET /api/weather/alerts
=========================================================== */

exports.getMyAlerts =
  async (req, res) => {
    try {
      const alerts =
        await WeatherAlert.find({
          farmer: req.farmer._id,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            "itinerary",
            "crop location"
          );

      return res.status(200).json({
        success: true,
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ===========================================================
   MARK ALERT AS READ
   POST /api/weather/alerts/:id/read
=========================================================== */

exports.markAlertAsRead =
  async (req, res) => {
    try {
      const alert =
        await WeatherAlert.findById(
          req.params.id
        );

      if (!alert) {
        return res.status(404).json({
          success: false,
          message:
            "Alert not found.",
        });
      }

      if (
        alert.farmer.toString() !==
        req.farmer._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      alert.isRead = true;

      await alert.save();

      return res.status(200).json({
        success: true,
        message:
          "Alert marked as read.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };