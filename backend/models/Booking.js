const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },

    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "completed",
      ],
      default: "pending",
    },

    // Farm address where equipment will be used
    farmAddress: {
      address: { type: String, default: "" },
      village: { type: String, default: "" },
      taluka: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      landmark: { type: String, default: "" },
    },

    // Review tracking
    reviewGiven: {
      type: Boolean,
      default: false,
    },

    reviewDate: {
      type: Date,
      default: null,
    },

    // Automated reminder tracking (sent ~24h before startDate to owner)
    ownerReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Booking",
  bookingSchema
);