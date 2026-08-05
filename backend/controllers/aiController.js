const CropItinerary = require("../models/CropItinerary");

const { generateContent } = require("../services/ai/geminiService");
const { buildCropPrompt } = require("../services/ai/promptBuilder");
const {
  parseGeminiResponse,
} = require("../services/ai/responseParser");

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
    } = req.body;

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
    console.log("🌾 Generating Crop Itinerary");
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
    });

    // Generate AI Response
    const aiResponse = await generateContent(prompt);

    // Parse JSON
    const parsed = parseGeminiResponse(aiResponse);

    // Save to MongoDB
    const itinerary = await CropItinerary.create({
      farmer: farmerId,

      crop,

      location: {
        state,
        district,
      },

      soilType,

      landArea,

      waterSource,

      budget,

      cropDuration: parsed.cropDuration,

      bestSeason: parsed.bestSeason,

      expectedYield: parsed.expectedYield,

      estimatedIncome: parsed.estimatedIncome,

      estimatedProfit: parsed.estimatedProfit,

      estimatedTotalCost: parsed.estimatedTotalCost,

      timeline: (parsed.timeline || []).map((item) => ({
        week: item.week,

        title:
          item.title ||
          item.activity ||
          "Farming Activity",

        description:
          item.description || "",

        originalDate: null,

        currentDate: null,

        status: "Upcoming",
      })),

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
              "",

            purpose:
              item.purpose || "",

            estimatedRent:
              item.estimatedRent ||
              item.estimatedRentalCost ||
              "",
          })
        ),

      labourRequirement:
        (parsed.labourRequirement || []).map(
          (item) => ({
            activity:
              item.activity || "",

            workers:
              item.workers ||
              item.workersRequired ||
              "",

            days:
              item.days ||
              item.estimatedDays ||
              "",
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