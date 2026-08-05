const express = require("express");
const router = express.Router();

const farmerAuth = require("../middleware/authMiddleware");

const {
  testAI,
  generateCropItinerary,
  getItinerary,
  getMyItineraries,
} = require("../controllers/aiController");

/* =====================================================
   AI Test (No Authentication)
===================================================== */

router.post(
  "/test",
  testAI
);

/* =====================================================
   Generate AI Crop Itinerary
===================================================== */

router.post(
  "/crop-itinerary",
  farmerAuth,
  generateCropItinerary
);

/* =====================================================
   Get Logged-in Farmer's Itinerary History
===================================================== */

router.get(
  "/my-itineraries",
  farmerAuth,
  getMyItineraries
);

/* =====================================================
   Get Single Itinerary
===================================================== */

router.get(
  "/itinerary/:id",
  farmerAuth,
  getItinerary
);

module.exports = router;