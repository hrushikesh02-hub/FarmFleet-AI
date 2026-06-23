const express = require("express");

const router = express.Router();

const {
  getOwnerDashboard,
} = require("../controllers/dashboardController");

const protectOwner = require(
  "../middleware/ownerAuthMiddleware"
);

router.get(
  "/",
  protectOwner,
  getOwnerDashboard
);

module.exports = router;