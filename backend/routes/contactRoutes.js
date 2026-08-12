'use strict';

const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");

/* ======================================================
   POST /api/contact
   Process Contact Form Submission
   ====================================================== */
router.post("/", submitContact);

module.exports = router;
