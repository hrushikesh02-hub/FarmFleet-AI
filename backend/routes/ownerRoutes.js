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
  getEquipmentStats,
} = require("../controllers/ownerController");

const protectOwner = require("../middleware/ownerAuthMiddleware");

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

// Register Owner
router.post("/signup", signup);

// Login Owner
router.post("/login", login);

/* ==========================
   PROFILE ROUTES
========================== */

// Get Owner Profile
router.get(
  "/profile",
  protectOwner,
  (req, res) => {
    res.status(200).json({
      success: true,
      owner: req.owner,
    });
  }
);

// Update Owner Profile
router.put(
  "/profile",
  protectOwner,
  updateProfile
);

// Upload Profile Photo
router.post(
  "/upload-photo",
  protectOwner,
  upload.single("photo"),
  uploadPhoto
);

router.delete(
  "/delete-account",
  protectOwner,
  deleteAccount
);

router.put(
  "/change-password",
  protectOwner,
  changePassword
);

/* ==========================
   OWNER DASHBOARD STATS
========================== */

router.get(
  "/equipment-stats",
  protectOwner,
  getEquipmentStats
);

module.exports = router;