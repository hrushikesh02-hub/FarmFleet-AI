const express = require("express");

const router = express.Router();

const {
  sendOTP,
  verifyOTP,
} = require(
  "../controllers/ownerOTPController"
);

/* ==========================
   OWNER EMAIL VERIFICATION
========================== */

// Send OTP to Email
router.post(
  "/send-otp",
  sendOTP
);

// Verify OTP & Create Owner Account
router.post(
  "/verify-otp",
  verifyOTP
);

module.exports = router;