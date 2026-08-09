const express = require("express");
const router = express.Router();

const labourAuth = require("../middleware/labourAuth");
const farmerAuth = require("../middleware/authMiddleware");

const {
  createRequest,
  checkAvailability,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  completeRequest,
  getRequestById,
  getRequestHistory,
  getFarmerRequests,
} = require("../controllers/labourRequestController");

/* ==========================
   FARMER ROUTES
========================== */

// Check labour availability
router.post(
  "/check-availability",
  farmerAuth,
  checkAvailability
);

// Farmer creates labour request
router.post(
  "/",
  farmerAuth,
  createRequest
);

// Farmer gets their labour requests
router.get(
  "/farmer",
  farmerAuth,
  getFarmerRequests
);

/* ==========================
   LABOUR ROUTES
========================== */

// Get all incoming requests
router.get(
  "/",
  labourAuth,
  getIncomingRequests
);

// Request history
router.get(
  "/history",
  labourAuth,
  getRequestHistory
);

// Get single request
router.get(
  "/:id",
  labourAuth,
  getRequestById
);

// Accept request
router.patch(
  "/:id/accept",
  labourAuth,
  acceptRequest
);

// Reject request
router.patch(
  "/:id/reject",
  labourAuth,
  rejectRequest
);

// Complete request
router.patch(
  "/:id/complete",
  labourAuth,
  completeRequest
);

module.exports = router;