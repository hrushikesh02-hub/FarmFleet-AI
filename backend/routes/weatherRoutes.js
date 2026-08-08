const express = require("express");

const router = express.Router();

const farmerAuth = require("../middleware/authMiddleware");

const {
  getCurrentWeather,
  getWeatherReport,
  checkWeatherForItinerary,
  updateWeatherSchedule,
  getMyAlerts,
  markAlertAsRead,
} = require("../controllers/weatherController");

/* =====================================================
   CURRENT WEATHER
   GET /api/weather/current?city=Ahmednagar
===================================================== */

router.get(
  "/current",
  farmerAuth,
  getCurrentWeather
);

/* =====================================================
   COMPLETE WEATHER REPORT
   GET /api/weather/report?city=Ahmednagar
===================================================== */

router.get(
  "/report",
  farmerAuth,
  getWeatherReport
);

/* =====================================================
   CHECK WEATHER FOR SINGLE ITINERARY
   POST /api/weather/check/:id
===================================================== */

router.post(
  "/check/:id",
  farmerAuth,
  checkWeatherForItinerary
);

/* =====================================================
   UPDATE WEATHER OPTIMIZED SCHEDULE
   POST /api/weather/update/:id
===================================================== */

router.post(
  "/update/:id",
  farmerAuth,
  updateWeatherSchedule
);

/* =====================================================
   GET ALL WEATHER ALERTS OF LOGGED-IN FARMER
   GET /api/weather/alerts
===================================================== */

router.get(
  "/alerts",
  farmerAuth,
  getMyAlerts
);

/* =====================================================
   MARK WEATHER ALERT AS READ
   POST /api/weather/alerts/:id/read
===================================================== */

router.post(
  "/alerts/:id/read",
  farmerAuth,
  markAlertAsRead
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = router;