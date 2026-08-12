const CropItinerary = require("../models/CropItinerary");
const fs = require("fs");
const path = require("path");

const { generateContent } = require("../services/ai/geminiService");
const { buildCropPrompt } = require("../services/ai/promptBuilder");
const {
  parseGeminiResponse,
} = require("../services/ai/responseParser");
const {
  generatePDF,
} = require("../services/pdf/pdfService");
const {
  getSafeWeatherReport,
} = require("../services/weather/weatherService");
const {
  generateSchedule,
} = require("../services/weather/dateScheduler");


/* =====================================================
   AI Test Endpoint
===================================================== */

exports.testAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    const response = await generateContent(prompt);

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Generate Crop Itinerary
===================================================== */

exports.generateCropItinerary = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    const {
      crop,
      state,
      district,
      soilType,
      landArea,
      waterSource,
      budget,
      language: reqLanguage,
    } = req.body;

    const validLangs = ["en", "hi", "mr", "gu", "ta", "te", "kn", "pa"];
    const language = validLangs.includes(reqLanguage)
      ? reqLanguage
      : (req.farmer?.preferredLanguage && validLangs.includes(req.farmer.preferredLanguage)
        ? req.farmer.preferredLanguage
        : "en");

    if (
      !crop ||
      !state ||
      !district ||
      !soilType ||
      !landArea ||
      !waterSource ||
      !budget
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    console.log("\n========================================");
    console.log(`🌾 Generating Crop Itinerary (${language.toUpperCase()})`);
    console.log("========================================");

    // Build Prompt
    const prompt = buildCropPrompt({
      crop,
      state,
      district,
      soilType,
      landArea,
      waterSource,
      budget,
      language,
    });

    // Generate AI Response
    const aiResponse = await generateContent(prompt);

    // Parse JSON
    const parsed = parseGeminiResponse(aiResponse);

    // Fetch live weather snapshot for district so weather info is present immediately
    let initialWeather = {};
    try {
      const weatherReport = await getSafeWeatherReport(district);
      if (weatherReport && weatherReport.currentWeather) {
        initialWeather = weatherReport.currentWeather;
      }
    } catch (weatherErr) {
      console.warn("Weather fetch warning on itinerary generation:", weatherErr.message);
    }

    // Build timeline items with scheduled dates
    const rawTimeline = (parsed.timeline || []).map((item) => ({
      week: item.week,
      title: item.title || item.activity || "Farming Activity",
      description: item.description || "",
      status: "Upcoming",
    }));
    const scheduledTimeline = generateSchedule(rawTimeline, new Date());

    // Save to MongoDB
    const itinerary = await CropItinerary.create({
      farmer: farmerId,
      language,

      crop,

      location: {
        state,
        district,
      },

      soilType,

      landArea,

      waterSource,

      budget,

      cropDuration: parsed.cropDuration || "4-5 Months",

      bestSeason: parsed.bestSeason || "Kharif",

      expectedYield: parsed.expectedYield || "25-30 Quintals/Acre",

      estimatedIncome: parsed.estimatedIncome || `₹${(Number(budget) * 2).toLocaleString("en-IN")}`,

      estimatedProfit: parsed.estimatedProfit || `₹${(Number(budget) * 1.2).toLocaleString("en-IN")}`,

      estimatedTotalCost: parsed.estimatedTotalCost || `₹${Number(budget).toLocaleString("en-IN")}`,

      aiSummary: {
        cropDuration: parsed.cropDuration,
        expectedYield: parsed.expectedYield,
        estimatedCost: parsed.estimatedTotalCost,
        estimatedIncome: parsed.estimatedIncome,
        estimatedProfit: parsed.estimatedProfit,
        bestSowingSeason: parsed.bestSeason,
        riskLevel: "Low Risk",
      },

      weather: initialWeather,

      lastWeatherCheck: new Date(),

      timeline: scheduledTimeline,

      landPreparation:
        parsed.landPreparation || [],

      seedRecommendation:
        parsed.seedRecommendation || {},

      fertilizerSchedule:
        parsed.fertilizerSchedule || [],

      irrigationSchedule:
        parsed.irrigationSchedule || [],

      weedManagement:
        parsed.weedManagement || [],

      pestAndDiseaseManagement:
        parsed.pestAndDiseaseManagement || [],

      equipmentRequired:
        (parsed.equipmentRequired || []).map(
          (item) => ({
            name:
              item.name ||
              item.equipment ||
              "Tractor",

            purpose:
              item.purpose || "Field Operations",

            estimatedRent:
              item.estimatedRent ||
              item.estimatedRentalCost ||
              "₹1,200 / hour",
          })
        ),

      labourRequirement:
        (parsed.labourRequirement || []).map(
          (item) => ({
            activity:
              item.activity || "Field Work",

            workers:
              item.workers ||
              item.workersRequired ||
              "2 workers",

            days:
              item.days ||
              item.estimatedDays ||
              "2 days",
          })
        ),

      precautions:
        parsed.precautions || [],

      governmentSchemes:
        parsed.governmentSchemes || [],

      tips:
        parsed.tips || [],

      aiResponse: parsed,
    });

    console.log("\n========================================");
    console.log("✅ Crop Itinerary Saved Successfully");
    console.log("========================================");

    return res.status(201).json({
      success: true,
      message: "Crop itinerary generated successfully.",
      itineraryId: itinerary._id,
      itinerary,
    });

  } catch (error) {
    console.error("\n========================================");
    console.error("❌ AI Controller Error");
    console.error("========================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Get Single Itinerary
===================================================== */

exports.getItinerary = async (req, res) => {
  try {
    const itinerary =
      await CropItinerary.findById(
        req.params.id
      );

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found.",
      });
    }

    // Ownership check — a farmer must only access their own itineraries
    if (itinerary.farmer.toString() !== req.farmer.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this itinerary.",
      });
    }

    // If weather is empty, auto-populate live weather for the itinerary's district
    if (!itinerary.weather || Object.keys(itinerary.weather).length === 0) {
      try {
        const city = itinerary.location?.district || itinerary.location?.state || "Ahmednagar";
        const weatherReport = await getSafeWeatherReport(city);
        if (weatherReport && weatherReport.currentWeather) {
          itinerary.weather = weatherReport.currentWeather;
          itinerary.lastWeatherCheck = new Date();
          await itinerary.save();
        }
      } catch (weatherErr) {
        console.warn("Auto weather fetch warning on getItinerary:", weatherErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      itinerary,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Farmer Itinerary History
===================================================== */

exports.getMyItineraries = async (
  req,
  res
) => {
  try {
    const farmerId = req.farmer.id;

    const itineraries =
      await CropItinerary.find({
        farmer: farmerId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: itineraries.length,
      itineraries,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Download Itinerary PDF
===================================================== */

exports.downloadItineraryPDF = async (req, res) => {
  try {
    const itineraryId = req.params.id;

    const itinerary = await CropItinerary.findById(itineraryId);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found.",
      });
    }

    // Ownership check (safely handle populated farmer object or raw ObjectId)
    const farmerIdStr = (itinerary.farmer._id || itinerary.farmer).toString();
    const reqFarmerIdStr = (req.farmer._id || req.farmer.id).toString();
    if (farmerIdStr !== reqFarmerIdStr) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this report.",
      });
    }

    // Generate (or regenerate) the PDF via pdfService
    const result = await generatePDF(itineraryId);

    if (!result || !result.pdfPath || !fs.existsSync(result.pdfPath)) {
      return res.status(500).json({
        success: false,
        message: "PDF generation failed — file not found on disk.",
      });
    }

    const filename = result.filename || `FarmFleet_AI_${itineraryId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    const stream = fs.createReadStream(result.pdfPath);
    stream.on("error", (err) => {
      console.error("[aiController] PDF stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error streaming PDF file.",
        });
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error("\n====================================");
    console.error("❌ PDF Download Error");
    console.error("====================================");
    console.error(error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to download PDF.",
      });
    }
  }
};

/* =====================================================
   Update Activity Status (Mark as Completed / Undo)
===================================================== */

exports.updateActivityStatus = async (req, res) => {
  try {
    const { id, activityIndex } = req.params;
    const { status } = req.body;

    const itinerary = await CropItinerary.findById(id);

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found.",
      });
    }

    // Ownership check (safely handle populated farmer object or raw ObjectId)
    const farmerIdStr = (itinerary.farmer._id || itinerary.farmer).toString();
    const reqFarmerIdStr = (req.farmer._id || req.farmer.id).toString();
    if (farmerIdStr !== reqFarmerIdStr) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this itinerary.",
      });
    }

    const idx = parseInt(activityIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= itinerary.timeline.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity index.",
      });
    }

    itinerary.timeline[idx].status = status || "Completed";
    itinerary.markModified("timeline");
    await itinerary.save();

    return res.status(200).json({
      success: true,
      message: `Activity status updated to "${itinerary.timeline[idx].status}".`,
      itinerary,
    });
  } catch (error) {
    console.error("Activity status update error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update activity status.",
    });
  }
};