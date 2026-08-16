"use strict";

const express = require("express");
const router = express.Router();
const {
  sendUpcomingBookingReminders,
  sendBookingReminderById,
} = require("../services/bookingReminderService");

/* ==========================================================
   CRON AUTHENTICATION MIDDLEWARE
   ----------------------------------------------------------
   Ensures external triggers (e.g. Render Cron, cron-job.org)
   must supply the matching CRON_SECRET for security.
========================================================== */
const requireCronAuth = (req, res, next) => {
  const configuredSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, enforce verification
  if (configuredSecret) {
    const headerSecret =
      req.headers["x-cron-secret"] ||
      (req.headers.authorization
        ? req.headers.authorization.replace("Bearer ", "").trim()
        : null) ||
      req.query.secret;

    if (!headerSecret || headerSecret !== configuredSecret) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing CRON_SECRET token.",
      });
    }
  }

  next();
};

/* ==========================================================
   ROUTES
========================================================== */

/**
 * @route   POST /api/cron/booking-reminders
 * @desc    Executes the owner booking reminder check for tomorrow's confirmed bookings
 * @access  Protected by CRON_SECRET
 */
router.post("/booking-reminders", requireCronAuth, async (req, res) => {
  try {
    const summary = await sendUpcomingBookingReminders();
    return res.status(200).json({
      success: true,
      message: "Owner booking reminders processed successfully.",
      summary,
    });
  } catch (error) {
    console.error("❌ Error in /api/cron/booking-reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error processing booking reminders.",
      error: error.message || error,
    });
  }
});

/**
 * @route   POST /api/cron/test-reminder/:bookingId
 * @desc    Manually triggers a booking reminder email for a specific booking ID
 * @access  Protected by CRON_SECRET
 */
router.post("/test-reminder/:bookingId", requireCronAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const force = req.body?.force === true || req.query?.force === "true";

    const result = await sendBookingReminderById(bookingId, { force });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Error in /api/cron/test-reminder/:bookingId:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error triggering test booking reminder.",
      error: error.message || error,
    });
  }
});

module.exports = router;
