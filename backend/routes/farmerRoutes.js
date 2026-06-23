const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  signup,
  login,
  updateProfile,
  uploadPhoto,
  deleteAccount,
  changePassword,
  getBookingStats,
} = require("../controllers/farmerController");

const protect = require("../middleware/authMiddleware");

/* ==========================
   MULTER CONFIG
========================== */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

/* ==========================
   AUTH ROUTES
========================== */

router.post("/signup", signup);
router.post("/login", login);

/* ==========================
   PROFILE ROUTES
========================== */

// Get Farmer Profile
router.get(
  "/profile",
  protect,
  (req, res) => {
    res.status(200).json({
      success: true,
      farmer: req.farmer,
    });
  }
);

// Update Farmer Profile
router.put(
  "/profile",
  protect,
  updateProfile
);

// Upload Farmer Profile Photo
router.post(
  "/upload-photo",
  protect,
  upload.single("photo"),
  uploadPhoto
);

// Delete Account
router.delete(
  "/delete-account",
  protect,
  deleteAccount
);

// Change Password
router.put(
  "/change-password",
  protect,
  changePassword
);

/* ==========================
   BOOKING STATS ROUTE
========================== */

router.get(
  "/booking-stats",
  protect,
  getBookingStats
);

module.exports = router;