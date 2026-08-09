const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
}) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  // Ensure receipt is max 40 chars as required by Razorpay API
  const formattedReceipt = String(receipt).slice(0, 40);

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: formattedReceipt,
  });

  return order;
};

const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }

  const generatedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
};

const verifyWebhookSignature = ({
  rawBody,
  signature,
}) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET is not set in environment.");
    return false;
  }

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
};