const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema(
  {
    week: String,
    title: String,
    description: String,

    weekNumber: Number,

    originalDate: Date,
    currentDate: Date,
    formattedDate: String,

    status: {
      type: String,
      default: "Scheduled",
    },

    delayed: {
      type: Boolean,
      default: false,
    },

    delayDays: {
      type: Number,
      default: 0,
    },

    delayReason: String,

    weatherDecision: {
      safe: Boolean,
      delayDays: Number,
      severity: String,
      weatherCondition: String,
      reason: String,
      recommendation: String,
      warnings: [String],
      recommendations: [String],
      riskScore: Number,
    },
  },
  { _id: false }
);

const cropItinerarySchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    crop: String,

    location: {
      state: String,
      district: String,
    },

    soilType: String,

    landArea: String,

    waterSource: String,

    budget: String,

    cropDuration: String,

    bestSeason: String,

    estimatedTotalCost: String,

    expectedYield: String,

    estimatedIncome: String,

    estimatedProfit: String,

    aiSummary: {
      type: Object,
      default: {},
    },

    landPreparation: [String],

    seedRecommendation: {
      variety: String,
      seedQuantity: String,
      estimatedCost: String,
    },

    timeline: [timelineSchema],

    fertilizerSchedule: [
      {
        stage: String,
        fertilizer: String,
        quantity: String,
        time: String,
      },
    ],

    irrigationSchedule: [
      {
        stage: String,
        frequency: String,
        waterRequirement: String,
      },
    ],

    weedManagement: [String],

    pestAndDiseaseManagement: [
      {
        problem: String,
        solution: String,
      },
    ],

    equipmentRequired: [
      {
        name: String,
        purpose: String,
        estimatedRent: String,
      },
    ],

    labourRequirement: [
      {
        activity: String,
        workers: String,
        days: String,
      },
    ],

    precautions: [String],

    tips: [String],

    weather: {
      type: Object,
      default: {},
    },

    lastWeatherCheck: Date,

    status: {
      type: String,
      default: "Active",
    },

    source: {
      type: String,
      enum: ["ai", "fallback", "cache"],
      default: "ai",
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr", "gu", "ta", "te", "kn", "pa"],
      default: "en",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CropItinerary",
  cropItinerarySchema
);