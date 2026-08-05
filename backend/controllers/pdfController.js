const fs = require("fs");
const path = require("path");

const CropItinerary = require("../models/CropItinerary");

const {
  generatePDF,
  getPDFPath,
  deletePDF,
} = require("../services/pdf/pdfService");

// ======================================================
// Generate PDF
// POST /api/pdf/generate/:id
// ======================================================

exports.generatePDF = async (req, res) => {
  try {
    const itineraryId = req.params.id;

    if (!itineraryId) {
      return res.status(400).json({
        success: false,
        message: "Itinerary ID is required.",
      });
    }

    const itinerary = await CropItinerary.findById(itineraryId);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Crop itinerary not found.",
      });
    }

    const result = await generatePDF(itineraryId);

    return res.status(200).json({
      success: true,
      message: "PDF generated successfully.",
      pdf: result,
    });
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ PDF Generation Error");
    console.error("====================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate PDF.",
    });
  }
};

// ======================================================
// Download PDF
// GET /api/pdf/download/:filename
// ======================================================

exports.downloadPDF = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }

    const pdfPath = getPDFPath(filename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF not found.",
      });
    }

    return res.download(pdfPath);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// View PDF
// GET /api/pdf/view/:filename
// ======================================================

exports.viewPDF = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }

    const pdfPath = getPDFPath(filename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF not found.",
      });
    }

    res.setHeader("Content-Type", "application/pdf");

    const stream = fs.createReadStream(pdfPath);

    stream.pipe(res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Delete PDF
// DELETE /api/pdf/delete/:filename
// ======================================================

exports.deletePDF = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }

    const pdfPath = getPDFPath(filename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "PDF not found.",
      });
    }

    await deletePDF(pdfPath);

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// Get PDF Details
// GET /api/pdf/info/:id
// ======================================================

exports.getPDFInfo = async (req, res) => {
  try {
    const itineraryId = req.params.id;

    const itinerary = await CropItinerary.findById(itineraryId);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Crop itinerary not found.",
      });
    }

    const filename = `FarmFleet_AI_${itineraryId}.pdf`;

    const pdfPath = getPDFPath(filename);

    return res.status(200).json({
      success: true,
      exists: fs.existsSync(pdfPath),
      filename,
      path: pdfPath,
      size: fs.existsSync(pdfPath)
        ? fs.statSync(pdfPath).size
        : 0,
      createdAt: fs.existsSync(pdfPath)
        ? fs.statSync(pdfPath).birthtime
        : null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};