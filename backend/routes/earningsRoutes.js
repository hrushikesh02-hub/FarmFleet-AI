const express = require("express");

const router = express.Router();

const {
  getOwnerEarnings,
} = require("../controllers/earningsController");

const protectOwner = require(
  "../middleware/ownerAuthMiddleware"
);

router.get(
  "/owner",
  protectOwner,
  getOwnerEarnings
);

module.exports = router;