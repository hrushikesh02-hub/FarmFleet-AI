const express = require("express");
const router = express.Router();

const farmerAuth = require("../middleware/authMiddleware");

const {
  testAI,
  generateCropItinerary,
  saveCropItinerary,
  getItinerary,
  getMyItineraries,
  downloadItineraryPDF,
  updateActivityStatus,
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
   Save Temporary Crop Itinerary
===================================================== */

router.post(
  "/save-itinerary",
  farmerAuth,
  saveCropItinerary
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
   Download Itinerary PDF
   (Must be registered BEFORE /itinerary/:id so Express
    matches the more specific path first.)
===================================================== */

router.get(
  "/itinerary/:id/pdf",
  farmerAuth,
  downloadItineraryPDF
);

/* =====================================================
   Update Activity Status (Mark as Completed / Undo)
===================================================== */

router.patch(
  "/itinerary/:id/activity/:activityIndex/status",
  farmerAuth,
  updateActivityStatus
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