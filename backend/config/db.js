const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`
    );

    // Safely sync Payment indexes and clean up legacy null values
    try {
      const Payment = require("../models/Payment");
      
      // Unset null values so sparse indexing works properly
      await Payment.updateMany(
        { razorpayPaymentId: null },
        { $unset: { razorpayPaymentId: "" } }
      );
      await Payment.updateMany(
        { razorpayOrderId: null },
        { $unset: { razorpayOrderId: "" } }
      );

      // Drop old index if present
      const collection = conn.connection.collection("payments");
      const indexes = await collection.indexes();

      const hasPaymentIdIdx = indexes.some((idx) => idx.name === "razorpayPaymentId_1");
      if (hasPaymentIdIdx) {
        await collection.dropIndex("razorpayPaymentId_1");
        console.log("🧹 Dropped legacy razorpayPaymentId_1 index");
      }

      const hasOrderIdIdx = indexes.some((idx) => idx.name === "razorpayOrderId_1");
      if (hasOrderIdIdx) {
        await collection.dropIndex("razorpayOrderId_1");
        console.log("🧹 Dropped legacy razorpayOrderId_1 index");
      }

      await Payment.createIndexes();
      console.log("✅ Payment indexes synchronized successfully.");
    } catch (idxErr) {
      console.log("ℹ️ Payment index check:", idxErr.message);
    }
  } catch (error) {
    console.error(
      `❌ MongoDB Connection Error: ${error.message}`
    );

    process.exit(1);
  }
};

module.exports = connectDB;