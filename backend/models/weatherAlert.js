const mongoose = require("mongoose");

const weatherAlertSchema = new mongoose.Schema(
  {
    // Farmer who owns the itinerary
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
      index: true,
    },

    // Related Crop Itinerary
    itinerary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropItinerary",
      required: true,
    },

    // Activity affected
    activity: {
      type: String,
      required: true,
      trim: true,
    },

    // Activity date before optimization
    activityDate: {
      type: Date,
      required: true,
    },

    // Suggested new date
    suggestedDate: {
      type: Date,
    },

    // Weather condition
    weatherCondition: {
      type: String,
      required: true,
    },

    // Alert severity
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    // Short reason
    reason: {
      type: String,
      required: true,
      trim: true,
    },

    // Recommendation to farmer
    recommendation: {
      type: String,
      required: true,
      trim: true,
    },

    // Number of delay days
    delayDays: {
      type: Number,
      default: 0,
    },

    // Email notification status
    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
    },

    // Farmer viewed alert?
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    // Is issue resolved?
    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================================
   Prevent duplicate alerts
=========================================== */

weatherAlertSchema.index({
  itinerary: 1,
  activity: 1,
  activityDate: 1,
});

/* ===========================================
   Export
=========================================== */

module.exports = mongoose.model(
  "WeatherAlert",
  weatherAlertSchema
);