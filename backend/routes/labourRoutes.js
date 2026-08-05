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
  getPublicLabours,
  getPublicLabourById, // <-- NEW
} = require("../controllers/labourController");

const {
  sendOTP,
  verifyOTP,
} = require("../controllers/labourOTPController");

const {
  getDashboard,
} = require("../controllers/labourDashboardController");

const labourAuth = require("../middleware/labourAuth");

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

// Send OTP
router.post("/send-otp", sendOTP);

// Verify OTP
router.post("/verify-otp", verifyOTP);

// Register Labour
router.post("/signup", signup);

// Login Labour
router.post("/login", login);

/* ==========================
   PROFILE ROUTES
========================== */

// Get Labour Profile
router.get(
  "/profile",
  labourAuth,
  (req, res) => {
    res.status(200).json({
      success: true,
      labour: req.labour,
    });
  }
);

// Update Labour Profile
router.put(
  "/profile",
  labourAuth,
  updateProfile
);

// Upload Labour Profile Photo
router.post(
  "/upload-photo",
  labourAuth,
  upload.single("profileImage"),
  uploadPhoto
);

/* ==========================
   ACCOUNT ROUTES
========================== */

// Change Password
router.put(
  "/change-password",
  labourAuth,
  changePassword
);

// Delete Account
router.delete(
  "/delete-account",
  labourAuth,
  deleteAccount
);

/* ==========================
   DASHBOARD
========================== */

// Dashboard Statistics
router.get(
  "/dashboard",
  labourAuth,
  getDashboard
);

/* ==========================
   PUBLIC ROUTES
========================== */

// Get All Available Labour Profiles
router.get(
  "/public",
  getPublicLabours
);

// Get Single Labour Profile by ID
router.get(
  "/public/:id",
  getPublicLabourById
);

module.exports = router;