const express = require("express");
const router = express.Router();

const labourAuth = require("../middleware/labourAuth");
const farmerAuth = require("../middleware/authMiddleware");

const {
  createReview,
  getLabourReviews,
  getPublicReviews,
  getLabourReviewById,
  getReviewsByLabourId,
} = require("../controllers/labourReviewController");

/* ==========================
   FARMER ROUTES
========================== */

// Farmer submits review
router.post(
  "/",
  farmerAuth,
  createReview
);

/* ==========================
   LABOUR ROUTES
========================== */

// Labour dashboard reviews
router.get(
  "/",
  labourAuth,
  getLabourReviews
);

/* ==========================
   PUBLIC ROUTES
========================== */

// Public reviews
router.get(
  "/public",
  getPublicReviews
);

// Reviews for specific labourer
router.get(
  "/labour/:id",
  getReviewsByLabourId
);

// Single review
router.get(
  "/:id",
  getLabourReviewById
);

module.exports = router;