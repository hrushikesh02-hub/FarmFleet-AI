const mongoose = require("mongoose");

const labourReviewSchema = new mongoose.Schema(
  {
    // Labour being reviewed
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Labour",
      required: true,
    },

    // Farmer who submitted the review
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    // Related Labour Request
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabourRequest",
      required: true,
    },

    // Related Equipment Booking (Optional)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // Related Equipment (Optional)
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      default: null,
    },

    // Rating
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review Comment
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate review for same request
labourReviewSchema.index(
  { request: 1 },
  { unique: true }
);

// Faster dashboard queries
labourReviewSchema.index({
  labour: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "LabourReview",
  labourReviewSchema
);