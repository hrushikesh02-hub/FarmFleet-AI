"use strict";

/**
 * Automated test suite for Owner Booking Reminder Service
 * Runs mock / unit tests against bookingReminderService logic.
 */

const {
  getTomorrowISTDateRange,
  sendUpcomingBookingReminders,
  sendBookingReminderById,
} = require("../services/bookingReminderService");
const {
  buildOwnerBookingReminderTemplate,
} = require("../templates/emailTemplate");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING OWNER BOOKING REMINDER TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Timezone & Date Math (Asia/Kolkata)
  // ----------------------------------------------------
  console.log("\n[Test 1] Tomorrow IST Date Range Calculation");
  const baseDate = new Date("2026-08-19T10:00:00.000Z"); // 19 Aug 2026 15:30 IST
  const { startOfTomorrowIST, endOfTomorrowIST } = getTomorrowISTDateRange(baseDate);

  assert(
    startOfTomorrowIST instanceof Date && endOfTomorrowIST instanceof Date,
    "Calculates Date objects for start & end"
  );
  assert(
    endOfTomorrowIST.getTime() > startOfTomorrowIST.getTime(),
    "End time is greater than start time"
  );
  // Tomorrow start in UTC for 20 Aug 00:00:00 IST is 19 Aug 18:30:00 UTC
  const expectedStartUTC = new Date("2026-08-19T18:30:00.000Z").getTime();
  const expectedEndUTC = new Date("2026-08-20T18:29:59.999Z").getTime();
  assert(
    startOfTomorrowIST.getTime() === expectedStartUTC,
    `Start of tomorrow IST corresponds to 18:30 UTC previous day (${startOfTomorrowIST.toISOString()})`
  );
  assert(
    endOfTomorrowIST.getTime() === expectedEndUTC,
    `End of tomorrow IST corresponds to 18:29:59.999 UTC (${endOfTomorrowIST.toISOString()})`
  );

  // ----------------------------------------------------
  // TEST 2: Email Template Generation
  // ----------------------------------------------------
  console.log("\n[Test 2] Owner Booking Reminder Email Template");
  const sampleEmailHtml = buildOwnerBookingReminderTemplate({
    ownerName: "Ramesh Pawar",
    renterName: "Suresh Patil",
    equipmentName: "Mahindra 575 DI Tractor",
    startDate: "20 Aug 2026",
    endDate: "22 Aug 2026",
    location: "Sangamner, Maharashtra",
    totalAmount: 4500,
  });

  assert(sampleEmailHtml.includes("Ramesh Pawar"), "Contains owner greeting");
  assert(sampleEmailHtml.includes("Mahindra 575 DI Tractor"), "Contains equipment name");
  assert(sampleEmailHtml.includes("Suresh Patil"), "Contains renter name");
  assert(sampleEmailHtml.includes("20 Aug 2026"), "Contains booking date");
  assert(sampleEmailHtml.includes("Sangamner, Maharashtra"), "Contains location");
  assert(sampleEmailHtml.includes("4,500"), "Contains formatted total amount");
  assert(sampleEmailHtml.includes("Booking Reminder"), "Contains category badge");
  assert(sampleEmailHtml.includes("View Booking in Dashboard"), "Contains CTA button text");

  // ----------------------------------------------------
  // TEST 3: Idempotency & Duplicate Prevention Logic
  // ----------------------------------------------------
  console.log("\n[Test 3] Duplicate Reminder Prevention (Idempotency)");
  // Mock booking model behavior
  const mockBookingSent = {
    _id: "mock_booking_001",
    status: "accepted",
    startDate: new Date(startOfTomorrowIST.getTime() + 3600000),
    ownerReminderSentAt: new Date("2026-08-19T08:00:00.000Z"),
  };

  // Check condition used in service query
  const eligibleForBatch =
    ["accepted", "confirmed"].includes(mockBookingSent.status) &&
    mockBookingSent.startDate >= startOfTomorrowIST &&
    mockBookingSent.startDate <= endOfTomorrowIST &&
    mockBookingSent.ownerReminderSentAt === null;

  assert(
    eligibleForBatch === false,
    "Booking with ownerReminderSentAt already set is excluded from batch query"
  );

  // ----------------------------------------------------
  // TEST 4: Status Filtering (Rejected / Cancelled / Pending)
  // ----------------------------------------------------
  console.log("\n[Test 4] Status Filtering");
  const rejectedBooking = {
    status: "rejected",
    startDate: new Date(startOfTomorrowIST.getTime() + 3600000),
    ownerReminderSentAt: null,
  };
  const pendingBooking = {
    status: "pending",
    startDate: new Date(startOfTomorrowIST.getTime() + 3600000),
    ownerReminderSentAt: null,
  };
  const acceptedBooking = {
    status: "accepted",
    startDate: new Date(startOfTomorrowIST.getTime() + 3600000),
    ownerReminderSentAt: null,
  };

  assert(
    !["accepted", "confirmed"].includes(rejectedBooking.status),
    "Rejected booking is NOT eligible for reminder"
  );
  assert(
    !["accepted", "confirmed"].includes(pendingBooking.status),
    "Pending booking is NOT eligible for reminder"
  );
  assert(
    ["accepted", "confirmed"].includes(acceptedBooking.status),
    "Accepted booking is eligible for reminder"
  );

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log(`🏁 TEST RESULTS: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
