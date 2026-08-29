/**
 * seedActivity.js
 * ---------------
 * Seeds realistic PAST ACTIVITY data between existing accounts and equipment.
 * Does NOT create any new Farmers, Owners, Labours, or Equipment.
 *
 * Run: node scripts/seedActivity.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Farmer    = require("../models/Farmer");
const Owner     = require("../models/Owner");
const Equipment = require("../models/Equipment");
const Labour    = require("../models/Labour");
const Booking   = require("../models/Booking");
const Payment   = require("../models/Payment");
const Review    = require("../models/Review");
const LabourRequest = require("../models/labourRequest");
const LabourReview  = require("../models/labourReview");

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Date that is `days` days before now */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Random integer between min and max (inclusive) */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Realistic Maharashtra place data ───────────────────────────────────────

const farmAddresses = [
  { address: "Survey No. 45", village: "Karanji",    taluka: "Rahuri",    district: "Ahmednagar", state: "Maharashtra", landmark: "Near Karanji Phata" },
  { address: "Gat No. 12",    village: "Hadapsar",   taluka: "Haveli",    district: "Pune",       state: "Maharashtra", landmark: "Near Solapur Road" },
  { address: "Survey No. 78", village: "Khed",       taluka: "Khed",      district: "Pune",       state: "Maharashtra", landmark: "Near Chakan Road" },
  { address: "Gat No. 34",    village: "Niphad",     taluka: "Niphad",    district: "Nashik",     state: "Maharashtra", landmark: "Near Godavari Canal" },
  { address: "Survey No. 22", village: "Sangamner",  taluka: "Sangamner", district: "Ahmednagar", state: "Maharashtra", landmark: "Near Pravara River" },
  { address: "Gat No. 56",    village: "Baramati",   taluka: "Baramati",  district: "Pune",       state: "Maharashtra", landmark: "Near Indrayani Bank" },
  { address: "Survey No. 91", village: "Pimpalgaon", taluka: "Niphad",    district: "Nashik",     state: "Maharashtra", landmark: "Near Grape Farm" },
  { address: "Gat No. 7",     village: "Rahuri",     taluka: "Rahuri",    district: "Ahmednagar", state: "Maharashtra", landmark: "Near Railway Gate" },
];

const equipmentReviewComments = [
  "Tractor was in excellent condition, work completed on time. Very satisfied!",
  "Good machine, operator was skilled and cooperative. Will book again.",
  "The equipment arrived on time and worked perfectly for my farm. Highly recommended.",
  "Very professional owner. The rotavator saved me a lot of time and labour cost.",
  "Excellent service! The harvester finished the work in one day. Great value.",
  "The cultivator was well-maintained and the operator knew his job well.",
  "Satisfied with the sprayer quality. Coverage was uniform and efficient.",
  "Seed drill machine was accurate and fuel-efficient. Good experience overall.",
  "Owner was punctual and machine was in working condition. No complaints.",
  "Very good experience. Will definitely recommend to other farmers in our village.",
];

const labourReviewComments = [
  "Suresh did an excellent job with the sowing. Very hardworking and skilled.",
  "Sunita is highly experienced in harvesting. Work was completed neatly.",
  "Ganesh handled the spraying very professionally. No wastage of chemicals.",
  "Dnyaneshwar's tillage work was top quality. Very strong and experienced.",
  "Labour came on time every day and worked diligently. Happy with the output.",
  "Great worker, honest and reliable. I will hire again next season.",
  "The work was done carefully and efficiently. Highly professional attitude.",
  "Very good at the job. Completed the task before schedule. Excellent.",
];

const labourNotes = [
  "Please bring your own tools if possible.",
  "Work starts at 7 AM. Lunch will be provided.",
  "Need help with sowing 4 acres of onion crop.",
  "Require assistance with paddy transplanting.",
  "Spraying pesticides on sugarcane field needed.",
  "Help needed for harvesting wheat crop.",
  "Tillage work for 3 acres before monsoon.",
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────

async function seedActivity() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/farmfleet";

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected!\n");

    // ── Fetch existing data ───────────────────────────────────────────────
    const farmers    = await Farmer.find({});
    const owners     = await Owner.find({});
    const equipments = await Equipment.find({});
    const labours    = await Labour.find({});

    if (!farmers.length)    throw new Error("No Farmers found in DB. Run seed.js first.");
    if (!owners.length)     throw new Error("No Owners found in DB. Run seed.js first.");
    if (!equipments.length) throw new Error("No Equipment found in DB. Run seed.js first.");
    if (!labours.length)    throw new Error("No Labour found in DB. Run seed.js first.");

    console.log(`📦 Found: ${farmers.length} farmers, ${owners.length} owners, ${equipments.length} equipment, ${labours.length} labours\n`);

    // ── Clean existing activity data (idempotent re-run) ─────────────────
    console.log("🧹 Clearing old activity data...");
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await LabourRequest.deleteMany({});
    await LabourReview.deleteMany({});
    console.log("✅ Cleared.\n");

    // ─────────────────────────────────────────────────────────────────────
    // 1. EQUIPMENT BOOKINGS
    // ─────────────────────────────────────────────────────────────────────
    console.log("🚜 Seeding Equipment Bookings...");

    const bookingConfigs = [
      // Completed bookings with reviews
      { farmerIdx: 0, equipIdx: 0, startDaysAgo: 90, durationDays: 3, acres: 5,  status: "completed", reviewGiven: true  },
      { farmerIdx: 1, equipIdx: 2, startDaysAgo: 75, durationDays: 2, acres: 4,  status: "completed", reviewGiven: true  },
      { farmerIdx: 0, equipIdx: 4, startDaysAgo: 60, durationDays: 1, acres: 6,  status: "completed", reviewGiven: true  },
      { farmerIdx: 1, equipIdx: 1, startDaysAgo: 45, durationDays: 4, acres: 8,  status: "completed", reviewGiven: true  },
      { farmerIdx: 0, equipIdx: 5, startDaysAgo: 30, durationDays: 2, acres: 3,  status: "completed", reviewGiven: true  },
      // Completed without review
      { farmerIdx: 1, equipIdx: 3, startDaysAgo: 20, durationDays: 3, acres: 5,  status: "completed", reviewGiven: false },
      // Accepted (ongoing)
      { farmerIdx: 0, equipIdx: 2, startDaysAgo: 10, durationDays: 5, acres: 10, status: "accepted",  reviewGiven: false },
      { farmerIdx: 1, equipIdx: 0, startDaysAgo:  5, durationDays: 2, acres: 4,  status: "accepted",  reviewGiven: false },
      // Rejected
      { farmerIdx: 0, equipIdx: 4, startDaysAgo: 50, durationDays: 2, acres: 4,  status: "rejected",  reviewGiven: false },
      // Pending
      { farmerIdx: 1, equipIdx: 5, startDaysAgo:  2, durationDays: 3, acres: 6,  status: "pending",   reviewGiven: false },
    ];

    const createdBookings = [];
    const paymentMethods  = ["cash", "cash", "razorpay"];

    for (const cfg of bookingConfigs) {
      const farmer    = farmers[cfg.farmerIdx % farmers.length];
      const equip     = equipments[cfg.equipIdx % equipments.length];
      const owner     = owners.find(o => o._id.equals(equip.owner)) || owners[0];
      const startDate = daysAgo(cfg.startDaysAgo);
      const endDate   = daysAgo(cfg.startDaysAgo - cfg.durationDays);
      const totalAmt  = (equip.pricePerDay || 3000) * cfg.durationDays;

      const booking = await Booking.create({
        renter:      farmer._id,
        owner:       owner._id,
        equipment:   equip._id,
        startDate,
        endDate,
        totalAmount: totalAmt,
        status:      cfg.status,
        farmAddress: pick(farmAddresses),
        acres:       cfg.acres,
        reviewGiven: cfg.reviewGiven,
        reviewDate:  cfg.reviewGiven ? daysAgo(cfg.startDaysAgo - cfg.durationDays - 1) : null,
      });

      createdBookings.push({ booking, farmer, owner, equip, ...cfg, totalAmt });
      console.log(`  ✔ [${cfg.status.toUpperCase().padEnd(9)}] ${farmer.fullName.padEnd(14)} booked "${equip.name}" — ₹${totalAmt}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. PAYMENTS FOR EQUIPMENT BOOKINGS
    // ─────────────────────────────────────────────────────────────────────
    console.log("\n💳 Seeding Equipment Payments...");

    for (const entry of createdBookings) {
      if (entry.status !== "completed") continue;

      const method     = pick(paymentMethods);
      const isRazorpay = method === "razorpay";

      await Payment.create({
        transactionType:     "equipment_booking",
        booking:             entry.booking._id,
        payer:               entry.farmer._id,
        payee:               entry.owner._id,
        payeeModel:          "Owner",
        amount:              entry.totalAmt,
        currency:            "INR",
        paymentMethod:       method,
        paymentStatus:       isRazorpay ? "paid" : "cash_received",
        razorpayOrderId:     isRazorpay ? `order_dummy_${entry.booking._id.toString().slice(-6)}` : undefined,
        razorpayPaymentId:   isRazorpay ? `pay_dummy_${entry.booking._id.toString().slice(-6)}`   : undefined,
        cashReceivedAt:      isRazorpay ? null : daysAgo(entry.startDaysAgo - entry.durationDays),
        cashReceivedBy:      isRazorpay ? null : entry.owner._id,
        cashReceivedByModel: isRazorpay ? null : "Owner",
        paidAt:              daysAgo(entry.startDaysAgo - entry.durationDays),
      });

      console.log(`  ✔ ₹${entry.totalAmt} via ${method.padEnd(8)} — ${entry.farmer.fullName} → ${entry.owner.fullName}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. EQUIPMENT REVIEWS
    // ─────────────────────────────────────────────────────────────────────
    console.log("\n⭐ Seeding Equipment Reviews...");

    let revIdx = 0;
    for (const entry of createdBookings) {
      if (!entry.reviewGiven) continue;

      await Review.create({
        owner:     entry.owner._id,
        farmer:    entry.farmer._id,
        equipment: entry.equip._id,
        booking:   entry.booking._id,
        rating:    randInt(4, 5),
        comment:   equipmentReviewComments[revIdx % equipmentReviewComments.length],
      });

      revIdx++;
      console.log(`  ✔ "${entry.equip.name}" reviewed by ${entry.farmer.fullName} — ★${randInt(4,5)}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. LABOUR REQUESTS
    // ─────────────────────────────────────────────────────────────────────
    console.log("\n👷 Seeding Labour Requests...");

    const labourRequestConfigs = [
      { farmerIdx: 0, labourIdx: 0, startDaysAgo: 85, durationDays: 5, status: "completed", reviewGiven: true  },
      { farmerIdx: 1, labourIdx: 1, startDaysAgo: 70, durationDays: 4, status: "completed", reviewGiven: true  },
      { farmerIdx: 0, labourIdx: 2, startDaysAgo: 55, durationDays: 3, status: "completed", reviewGiven: true  },
      { farmerIdx: 1, labourIdx: 3, startDaysAgo: 40, durationDays: 6, status: "completed", reviewGiven: true  },
      { farmerIdx: 0, labourIdx: 1, startDaysAgo: 25, durationDays: 2, status: "completed", reviewGiven: false },
      { farmerIdx: 1, labourIdx: 2, startDaysAgo:  8, durationDays: 3, status: "accepted",  reviewGiven: false },
      { farmerIdx: 0, labourIdx: 3, startDaysAgo: 48, durationDays: 2, status: "rejected",  reviewGiven: false },
      { farmerIdx: 1, labourIdx: 0, startDaysAgo:  1, durationDays: 4, status: "pending",   reviewGiven: false },
    ];

    const createdLabourRequests = [];

    for (const cfg of labourRequestConfigs) {
      const farmer    = farmers[cfg.farmerIdx % farmers.length];
      const labour    = labours[cfg.labourIdx % labours.length];
      const startDate = daysAgo(cfg.startDaysAgo);
      const endDate   = daysAgo(cfg.startDaysAgo - cfg.durationDays);
      const daily     = labour.dailyCharges || 400;
      const totalAmt  = daily * cfg.durationDays;
      const addr      = pick(farmAddresses);

      const isRejected  = cfg.status === "rejected";
      const isCompleted = cfg.status === "completed";
      const isAccepted  = cfg.status === "accepted" || isCompleted;

      const labourRequest = await LabourRequest.create({
        farmer:        farmer._id,
        labour:        labour._id,
        startDate,
        endDate,
        village:       addr.village,
        district:      addr.district,
        dailyCharges:  daily,
        totalAmount:   totalAmt,
        status:        cfg.status,
        notes:         pick(labourNotes),
        reviewGiven:   cfg.reviewGiven,
        reviewDate:    cfg.reviewGiven ? daysAgo(cfg.startDaysAgo - cfg.durationDays - 1) : null,
        paymentStatus: isCompleted ? "cash_received" : "pending",
        acceptedAt:    isAccepted  && !isRejected ? daysAgo(cfg.startDaysAgo + 1) : null,
        rejectedAt:    isRejected  ? daysAgo(cfg.startDaysAgo + 1) : null,
        completedAt:   isCompleted ? daysAgo(cfg.startDaysAgo - cfg.durationDays) : null,
        rejectionReason: isRejected ? "Not available on the requested dates." : "",
      });

      createdLabourRequests.push({ labourRequest, farmer, labour, ...cfg, totalAmt, daily });
      console.log(`  ✔ [${cfg.status.toUpperCase().padEnd(9)}] ${farmer.fullName.padEnd(14)} → ${labour.fullName} (${labour.primarySkill}) — ₹${totalAmt}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. PAYMENTS FOR LABOUR REQUESTS
    // ─────────────────────────────────────────────────────────────────────
    console.log("\n💰 Seeding Labour Payments...");

    for (const entry of createdLabourRequests) {
      if (entry.status !== "completed") continue;

      const method     = pick(paymentMethods);
      const isRazorpay = method === "razorpay";

      await Payment.create({
        transactionType:     "labour_request",
        labourRequest:       entry.labourRequest._id,
        payer:               entry.farmer._id,
        payee:               entry.labour._id,
        payeeModel:          "Labour",
        amount:              entry.totalAmt,
        currency:            "INR",
        paymentMethod:       method,
        paymentStatus:       isRazorpay ? "paid" : "cash_received",
        razorpayOrderId:     isRazorpay ? `order_lab_${entry.labourRequest._id.toString().slice(-6)}` : undefined,
        razorpayPaymentId:   isRazorpay ? `pay_lab_${entry.labourRequest._id.toString().slice(-6)}`   : undefined,
        cashReceivedAt:      isRazorpay ? null : daysAgo(entry.startDaysAgo - entry.durationDays),
        cashReceivedBy:      isRazorpay ? null : entry.labour._id,
        cashReceivedByModel: isRazorpay ? null : "Labour",
        paidAt:              daysAgo(entry.startDaysAgo - entry.durationDays),
      });

      console.log(`  ✔ ₹${entry.totalAmt} via ${method.padEnd(8)} — ${entry.farmer.fullName} → ${entry.labour.fullName}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. LABOUR REVIEWS
    // ─────────────────────────────────────────────────────────────────────
    console.log("\n🌟 Seeding Labour Reviews...");

    let labRevIdx = 0;
    for (const entry of createdLabourRequests) {
      if (!entry.reviewGiven) continue;

      await LabourReview.create({
        labour:  entry.labour._id,
        farmer:  entry.farmer._id,
        request: entry.labourRequest._id,
        rating:  randInt(4, 5),
        comment: labourReviewComments[labRevIdx % labourReviewComments.length],
      });

      labRevIdx++;
      console.log(`  ✔ ${entry.labour.fullName} reviewed by ${entry.farmer.fullName}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────
    const completedBookings = createdBookings.filter(b => b.status === "completed").length;
    const completedLabour   = createdLabourRequests.filter(l => l.status === "completed").length;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Activity seeding complete! Summary:");
    console.log(`   🚜 Equipment Bookings : ${createdBookings.length}  (${completedBookings} completed)`);
    console.log(`   💳 Equipment Payments : ${completedBookings}`);
    console.log(`   ⭐ Equipment Reviews  : ${createdBookings.filter(b => b.reviewGiven).length}`);
    console.log(`   👷 Labour Requests    : ${createdLabourRequests.length}  (${completedLabour} completed)`);
    console.log(`   💰 Labour Payments    : ${completedLabour}`);
    console.log(`   🌟 Labour Reviews     : ${createdLabourRequests.filter(l => l.reviewGiven).length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (err) {
    console.error("❌ seedActivity failed:", err.message || err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

seedActivity();
