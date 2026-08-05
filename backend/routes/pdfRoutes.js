const express = require("express");

const router = express.Router();

const {
  generatePDF,
  downloadPDF,
  viewPDF,
  deletePDF,
  getPDFInfo,
} = require("../controllers/pdfController");

// ======================================================
// Generate PDF
// POST /api/pdf/generate/:id
// ======================================================

router.post("/generate/:id", generatePDF);

// ======================================================
// View PDF in Browser
// GET /api/pdf/view/:filename
// ======================================================

router.get("/view/:filename", viewPDF);

// ======================================================
// Download PDF
// GET /api/pdf/download/:filename
// ======================================================

router.get("/download/:filename", downloadPDF);

// ======================================================
// Get PDF Information
// GET /api/pdf/info/:id
// ======================================================

router.get("/info/:id", getPDFInfo);

// ======================================================
// Delete PDF
// DELETE /api/pdf/delete/:filename
// ======================================================

router.delete("/delete/:filename", deletePDF);

// ======================================================
// Export Router
// ======================================================

module.exports = router;