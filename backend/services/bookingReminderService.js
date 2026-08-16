"use strict";

const Booking = require("../models/Booking");
const { sendEmail } = require("../config/mail");
const {
  buildOwnerBookingReminderTemplate,
} = require("../templates/emailTemplate");

/* ==========================================================
   TIMEZONE & DATE HELPERS (Asia/Kolkata / IST)
========================================================== */

/**
 * Calculates start and end of tomorrow in Indian Standard Time (IST, UTC+5:30)
 * converted to standard UTC Date instances for MongoDB querying.
 */
const getTomorrowISTDateRange = (baseDate = new Date()) => {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(baseDate.getTime() + istOffsetMs);

  const tomorrowYear = istNow.getUTCFullYear();
  const tomorrowMonth = istNow.getUTCMonth();
  const tomorrowDate = istNow.getUTCDate() + 1;

  const startOfTomorrowIST = new Date(
    Date.UTC(tomorrowYear, tomorrowMonth, tomorrowDate, 0, 0, 0, 0) - istOffsetMs
  );
  const endOfTomorrowIST = new Date(
    Date.UTC(tomorrowYear, tomorrowMonth, tomorrowDate, 23, 59, 59, 999) - istOffsetMs
  );

  return { startOfTomorrowIST, endOfTomorrowIST };
};

const formatDateIST = (dateObj) => {
  if (!dateObj) return "";
  return new Date(dateObj).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ==========================================================
   SCHEDULED BATCH REMINDER SERVICE
========================================================== */

/**
 * Finds all confirmed/accepted bookings scheduled for tomorrow
 * and sends an automated reminder email to each equipment owner.
 *
 * Idempotent: Skips any booking that already has ownerReminderSentAt set.
 */
const sendUpcomingBookingReminders = async () => {
  const now = new Date();
  const { startOfTomorrowIST, endOfTomorrowIST } = getTomorrowISTDateRange(now);

  console.log("\n==================================================");
  console.log("⏰ Running Automated Owner Booking Reminder Job");
  console.log("Current Time (UTC):", now.toISOString());
  console.log("Tomorrow Target Range (IST):", startOfTomorrowIST.toISOString(), "→", endOfTomorrowIST.toISOString());
  console.log("==================================================");

  try {
    // 1. Query only confirmed bookings for tomorrow without prior reminder
    const upcomingBookings = await Booking.find({
      status: { $in: ["accepted", "confirmed"] },
      startDate: { $gte: startOfTomorrowIST, $lte: endOfTomorrowIST },
      ownerReminderSentAt: null,
    })
      .populate("owner", "fullName email mobile village district state")
      .populate("renter", "fullName mobile village district state")
      .populate("equipment", "name type location");

    console.log(`📋 Found ${upcomingBookings.length} booking(s) eligible for owner reminders.`);

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const booking of upcomingBookings) {
      const owner = booking.owner;
      const renter = booking.renter;
      const equipment = booking.equipment;

      // Validate owner email exists
      if (!owner || !owner.email) {
        console.warn(`⚠️  Skipping booking ${booking._id}: Owner has no valid email address.`);
        skippedCount++;
        results.push({ bookingId: booking._id, status: "skipped", reason: "Owner missing email" });
        continue;
      }

      // Format detail fields
      const formattedStartDate = formatDateIST(booking.startDate);
      const formattedEndDate = formatDateIST(booking.endDate);
      const location = equipment?.location || (owner.village ? `${owner.village}, ${owner.district || ""}` : "");

      const emailHtml = buildOwnerBookingReminderTemplate({
        ownerName: owner.fullName || "Equipment Owner",
        renterName: renter?.fullName || "Verified Farmer",
        equipmentName: equipment?.name || "Equipment",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        location,
        totalAmount: booking.totalAmount,
      });

      console.log(`📨 Sending booking reminder for booking ${booking._id} to owner: ${owner.email} (${owner.fullName})`);

      const emailResult = await sendEmail({
        to: owner.email,
        subject: "FarmFleet Booking Reminder — Your Booking is Tomorrow 🚜",
        html: emailHtml,
      });

      if (emailResult.success) {
        // Record timestamp for idempotency
        booking.ownerReminderSentAt = new Date();
        await booking.save();

        sentCount++;
        console.log(`✅ Reminder recorded for booking ${booking._id} at ${booking.ownerReminderSentAt.toISOString()}`);
        results.push({ bookingId: booking._id, status: "sent", ownerEmail: owner.email });
      } else {
        failedCount++;
        console.error(`❌ Failed to send reminder for booking ${booking._id}: ${emailResult.error}`);
        results.push({ bookingId: booking._id, status: "failed", error: emailResult.error });
      }
    }

    console.log("\n==================================================");
    console.log(`🏁 Booking Reminder Summary: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped.`);
    console.log("==================================================\n");

    return {
      success: true,
      processed: upcomingBookings.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      results,
    };
  } catch (error) {
    console.error("❌ Fatal error during sendUpcomingBookingReminders execution:", error);
    return {
      success: false,
      error: error.message || error,
    };
  }
};

/* ==========================================================
   INDIVIDUAL / TEST REMINDER SERVICE
========================================================== */

/**
 * Sends a reminder for a specific booking by ID.
 * Supports { force: true } to bypass tomorrow date check for development/testing.
 */
const sendBookingReminderById = async (bookingId, { force = false } = {}) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("owner", "fullName email mobile village district state")
      .populate("renter", "fullName mobile village district state")
      .populate("equipment", "name type location");

    if (!booking) {
      return { success: false, message: `Booking not found with ID: ${bookingId}` };
    }

    // Status check
    if (!["accepted", "confirmed"].includes(booking.status)) {
      return {
        success: false,
        message: `Booking ${bookingId} has status '${booking.status}'. Reminders can only be sent for confirmed/accepted bookings.`,
      };
    }

    // Duplicate check
    if (booking.ownerReminderSentAt && !force) {
      return {
        success: false,
        message: `Reminder was already sent for booking ${bookingId} on ${booking.ownerReminderSentAt.toISOString()}. Use force: true to re-send.`,
      };
    }

    const owner = booking.owner;
    if (!owner || !owner.email) {
      return { success: false, message: `Owner for booking ${bookingId} does not have a registered email.` };
    }

    const formattedStartDate = formatDateIST(booking.startDate);
    const formattedEndDate = formatDateIST(booking.endDate);
    const location = booking.equipment?.location || (owner.village ? `${owner.village}, ${owner.district || ""}` : "");

    const emailHtml = buildOwnerBookingReminderTemplate({
      ownerName: owner.fullName || "Equipment Owner",
      renterName: booking.renter?.fullName || "Verified Farmer",
      equipmentName: booking.equipment?.name || "Equipment",
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      location,
      totalAmount: booking.totalAmount,
    });

    const emailResult = await sendEmail({
      to: owner.email,
      subject: "FarmFleet Booking Reminder — Your Booking is Tomorrow 🚜",
      html: emailHtml,
    });

    if (emailResult.success) {
      booking.ownerReminderSentAt = new Date();
      await booking.save();
      return {
        success: true,
        message: `Reminder successfully sent to owner ${owner.email}`,
        bookingId: booking._id,
        ownerReminderSentAt: booking.ownerReminderSentAt,
      };
    } else {
      return {
        success: false,
        message: `Failed to deliver email: ${emailResult.error}`,
      };
    }
  } catch (error) {
    console.error(`❌ Error in sendBookingReminderById for ID ${bookingId}:`, error);
    return { success: false, error: error.message || error };
  }
};

module.exports = {
  getTomorrowISTDateRange,
  sendUpcomingBookingReminders,
  sendBookingReminderById,
};
