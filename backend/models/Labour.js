const mongoose = require("mongoose");

const labourSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    village: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    // Labour Specific
    primarySkill: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      required: true,
      enum: [
        "Fresher",
        "1-3 Years",
        "3-5 Years",
        "5-10 Years",
        "10+ Years",
      ],
    },

    dailyCharges: {
      type: Number,
      required: true,
      min: 0,
    },

    password: {
      type: String,
      required: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    labourType: {
      type: String,
      default: "Agricultural Labour",
    },

    availability: {
      type: String,
      enum: [
        "Available",
        "Busy",
        "On Leave",
      ],
      default: "Available",
    },

    completedJobs: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "mr"],
      default: "en",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Labour",
  labourSchema
);