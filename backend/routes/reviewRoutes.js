const express = require("express");

const router = express.Router();

const protectOwner = require(
  "../middleware/ownerAuthMiddleware"
);

const protectFarmer = require(
  "../middleware/authMiddleware"
);

const {
  createReview,
  getOwnerReviews,
  getEquipmentReviews,
  getPublicReviews,
} = require(
  "../controllers/reviewController"
);

/* ==========================
   FARMER REVIEW ROUTES
========================== */

// Submit review after completed booking
router.post(
  "/create",
  protectFarmer,
  createReview
);

/* ==========================
   OWNER REVIEW ROUTES
========================== */

// Get all reviews for logged-in owner
router.get(
  "/owner",
  protectOwner,
  getOwnerReviews
);

/* ==========================
   PUBLIC REVIEW ROUTES
========================== */

// Get reviews for a specific equipment
router.get(
  "/equipment/:id",
  getEquipmentReviews
);

router.get(
  "/public",
  getPublicReviews
);

module.exports = router;