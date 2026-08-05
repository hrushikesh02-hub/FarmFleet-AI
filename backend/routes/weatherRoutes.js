const express = require("express");

const router = express.Router();

const farmerAuth = require("../middleware/authMiddleware");

const {
  getCurrentWeather,
  getWeatherReport,
  refreshWeather,
  checkWeatherForItinerary,
  updateWeatherSchedule,
} = require("../controllers/weatherController");

/* =====================================================
   Current Weather By City
   GET /api/weather/current?city=Ahmednagar
===================================================== */

router.get(
  "/current",
  farmerAuth,
  getCurrentWeather
);

/* =====================================================
   Complete Weather Report By City
   GET /api/weather/report?city=Ahmednagar
===================================================== */

router.get(
  "/report",
  farmerAuth,
  getWeatherReport
);

/* =====================================================
   Refresh Weather For Existing Itinerary
   GET /api/weather/current/:id
===================================================== */

router.get(
  "/current/:id",
  farmerAuth,
  refreshWeather
);

/* =====================================================
   Check Weather & Optimize Schedule
   POST /api/weather/check/:id
===================================================== */

router.post(
  "/check/:id",
  farmerAuth,
  checkWeatherForItinerary
);

/* =====================================================
   Force Update Weather Optimized Schedule
   POST /api/weather/update/:id
===================================================== */

router.post(
  "/update/:id",
  farmerAuth,
  updateWeatherSchedule
);

/* =====================================================
   Export Router
===================================================== */

module.exports = router;