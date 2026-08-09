const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ["equipment_booking", "labour_request"],
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    labourRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabourRequest",
      default: null,
    },

    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    payee: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "payeeModel",
      default: null,
    },

    payeeModel: {
      type: String,
      enum: ["Owner", "Labour"],
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cash"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "cash_pending",
        "cash_received",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpaySignature: {
      type: String,
    },

    cashReceivedAt: {
      type: Date,
      default: null,
    },

    cashReceivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "cashReceivedByModel",
      default: null,
    },

    cashReceivedByModel: {
      type: String,
      enum: ["Owner", "Labour", "Farmer", "Admin"],
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    refundId: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  transactionType: 1,
  booking: 1,
});

paymentSchema.index({
  transactionType: 1,
  labourRequest: 1,
});

paymentSchema.index({
  payer: 1,
  paymentStatus: 1,
});

module.exports = mongoose.model("Payment", paymentSchema);