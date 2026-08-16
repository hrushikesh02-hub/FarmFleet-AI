"use strict";

const cron = require("node-cron");
const {
  sendUpcomingBookingReminders,
} = require("../services/bookingReminderService");

/* ==========================================================
   Owner Booking Reminder Scheduled Job
   ----------------------------------------------------------
   Runs every day at 8:00 AM IST (Asia/Kolkata).
   Queries confirmed bookings occurring the next calendar day
   and sends an automatic reminder email to the owner.
========================================================== */

const startBookingReminderJob = () => {
  console.log("⏰ Owner Booking Reminder Scheduled Job Initialized");

  // Every day at 8:00 AM IST
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("\n======================================");
      console.log("⏰ Starting Daily Owner Booking Reminder Check");
      console.log("Local Time:", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
      console.log("======================================");

      try {
        const result = await sendUpcomingBookingReminders();
        console.log("✅ Booking reminder check finished:", JSON.stringify(result));
      } catch (error) {
        console.error("❌ Booking Reminder Job execution failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = {
  startBookingReminderJob,
};
