const express = require("express");
const router = express.Router();

const protectOwner =
  require("../middleware/ownerAuthMiddleware");

const protectFarmer =
  require("../middleware/authMiddleware");

const {
  checkAvailability,
  createBooking,
  getFarmerBookings,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
} = require("../controllers/bookingController");

/* ==========================
   AVAILABILITY CHECK
========================== */

// Check equipment availability
router.post(
  "/check-availability",
  protectFarmer,
  checkAvailability
);

/* ==========================
   FARMER BOOKINGS
========================== */

// Create booking request
router.post(
  "/create",
  protectFarmer,
  createBooking
);

// Get logged-in farmer bookings
router.get(
  "/farmer",
  protectFarmer,
  getFarmerBookings
);

/* ==========================
   OWNER BOOKINGS
========================== */

// Get all owner bookings
router.get(
  "/owner",
  protectOwner,
  getOwnerBookings
);

// Accept booking
router.put(
  "/accept/:id",
  protectOwner,
  acceptBooking
);

// Reject booking
router.put(
  "/reject/:id",
  protectOwner,
  rejectBooking
);

// Complete booking
router.put(
  "/complete/:id",
  protectOwner,
  completeBooking
);

module.exports = router;