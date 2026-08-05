const express = require("express");
const router = express.Router();

const labourAuth = require("../middleware/labourAuth");

const {
  getEarnings,
  getMonthlyEarnings,
} = require("../controllers/labourEarningsController");

/* ==========================
   LABOUR EARNINGS
========================== */

// Overall earnings summary
router.get(
  "/",
  labourAuth,
  getEarnings
);

// Monthly earnings
router.get(
  "/monthly",
  labourAuth,
  getMonthlyEarnings
);

module.exports = router;