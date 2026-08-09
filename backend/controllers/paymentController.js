const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const LabourRequest = require("../models/labourRequest");
const Owner = require("../models/Owner");
const Labour = require("../models/Labour");

const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} = require("../services/paymentService");

/* =====================================================
   HELPERS
===================================================== */

const getTransaction = async (
  transactionType,
  transactionId
) => {
  if (transactionType === "equipment_booking") {
    const booking = await Booking.findById(transactionId);

    if (!booking) {
      return {
        error: "Booking not found",
        status: 404,
      };
    }

    return {
      booking,
      amount: booking.totalAmount,
      payer: booking.renter,
      payee: booking.owner,
      payeeModel: "Owner",
    };
  }

  if (transactionType === "labour_request") {
    const labourRequest =
      await LabourRequest.findById(transactionId);

    if (!labourRequest) {
      return {
        error: "Labour request not found",
        status: 404,
      };
    }

    return {
      labourRequest,
      amount: labourRequest.totalAmount,
      payer: labourRequest.farmer,
      payee: labourRequest.labour,
      payeeModel: "Labour",
    };
  }

  return {
    error: "Invalid transaction type",
    status: 400,
  };
};

/* =====================================================
   CREATE PAYMENT ORDER
===================================================== */

const createPaymentOrder = async (req, res) => {
  try {
    const {
      transactionType,
      transactionId,
    } = req.body;

    if (!transactionType || !transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "transactionType and transactionId are required",
      });
    }

    const transaction = await getTransaction(
      transactionType,
      transactionId
    );

    if (transaction.error) {
      return res.status(transaction.status).json({
        success: false,
        message: transaction.error,
      });
    }

    const {
      booking,
      labourRequest,
      amount,
      payer,
      payee,
      payeeModel,
    } = transaction;

    /* ================================================
       VERIFY FARMER OWNERSHIP
    ================================================ */

    if (
      payer.toString() !==
      req.farmer._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to make this payment",
      });
    }

    /* ================================================
       VALIDATE AMOUNT
    ================================================ */

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction amount",
      });
    }

    /* ================================================
       CHECK TRANSACTION STATUS
    ================================================ */

    if (transactionType === "equipment_booking") {
      if (
        booking.status === "rejected" ||
        booking.status === "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment is not allowed for this booking",
        });
      }
    }

    if (transactionType === "labour_request") {
      if (
        labourRequest.status === "rejected" ||
        labourRequest.status === "cancelled" ||
        labourRequest.status === "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment is not allowed for this labour request",
        });
      }
    }

    /* ================================================
       CHECK EXISTING SUCCESSFUL PAYMENT
    ================================================ */

    const existingPaidPayment =
      await Payment.findOne({
        transactionType,
        ...(transactionType === "equipment_booking"
          ? { booking: transactionId }
          : { labourRequest: transactionId }),
        paymentStatus: {
          $in: ["paid", "cash_received"],
        },
      });

    if (existingPaidPayment) {
      return res.status(400).json({
        success: false,
        message: "This transaction has already been paid",
        payment: existingPaidPayment,
      });
    }

    /* ================================================
       CHECK EXISTING RAZORPAY ORDER
    ================================================ */

    const existingPayment =
      await Payment.findOne({
        transactionType,
        ...(transactionType === "equipment_booking"
          ? { booking: transactionId }
          : { labourRequest: transactionId }),
        paymentMethod: "razorpay",
        paymentStatus: {
          $in: ["created", "pending"],
        },
      });

    if (
      existingPayment &&
      existingPayment.razorpayOrderId
    ) {
      return res.status(200).json({
        success: true,
        message: "Existing payment order found",
        orderId:
          existingPayment.razorpayOrderId,
        amount: existingPayment.amount * 100,
        currency: existingPayment.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: existingPayment._id,
      });
    }

    /* ================================================
       CREATE RAZORPAY ORDER
    ================================================ */

    const shortReceipt =
      transactionType === "equipment_booking"
        ? `FF-EQ-${transactionId}`
        : `FF-LB-${transactionId}`;

    const razorpayOrder = await createRazorpayOrder({
      amount,
      currency: "INR",
      receipt: shortReceipt,
    });

    /* ================================================
       CREATE PAYMENT RECORD
    ================================================ */

    const payment = await Payment.create({
      transactionType,

      booking:
        transactionType === "equipment_booking"
          ? transactionId
          : null,

      labourRequest:
        transactionType === "labour_request"
          ? transactionId
          : null,

      payer,

      payee,

      payeeModel,

      amount,

      currency: "INR",

      paymentMethod: "razorpay",

      paymentStatus: "created",

      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",

      paymentId: payment._id,

      orderId: razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency: razorpayOrder.currency,

      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Payment Order Error:", {
      transactionType: req.body?.transactionType,
      transactionId: req.body?.transactionId,
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order",
    });
  }
};

/* =====================================================
   VERIFY RAZORPAY PAYMENT
===================================================== */

const verifyPayment = async (req, res) => {
  try {
    const transactionType = req.body.transactionType;
    const transactionId = req.body.transactionId;
    const razorpayPaymentId =
      req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpayOrderId =
      req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpaySignature =
      req.body.razorpaySignature || req.body.razorpay_signature;

    if (
      !transactionType ||
      !transactionId ||
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All payment verification fields are required",
      });
    }

    const paymentQuery = {
      transactionType,

      ...(transactionType === "equipment_booking"
        ? { booking: transactionId }
        : { labourRequest: transactionId }),

      payer: req.farmer._id,
    };

    const payment =
      await Payment.findOne(paymentQuery);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    /* ================================================
       IDEMPOTENCY
    ================================================ */

    if (payment.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        payment,
      });
    }

    /* ================================================
       VERIFY ORDER ID FROM DATABASE
    ================================================ */

    if (
      payment.razorpayOrderId !==
      razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay order",
      });
    }

    /* ================================================
       VERIFY SIGNATURE
    ================================================ */

    let isValid = false;

    try {
      isValid = verifyRazorpaySignature({
        orderId: payment.razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    } catch (signatureError) {
      console.error(
        "Signature Verification Error:",
        signatureError
      );

      isValid = false;
    }

    if (!isValid) {
      payment.paymentStatus = "failed";
      payment.failureReason =
        "Invalid Razorpay signature";

      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    /* ================================================
       SAVE PAYMENT
    ================================================ */

    payment.razorpayPaymentId =
      razorpayPaymentId;

    payment.razorpaySignature =
      razorpaySignature;

    payment.paymentStatus = "paid";

    payment.paidAt = new Date();

    await payment.save();

    /* ================================================
       LABOUR PAYMENT STATUS SYNC
    ================================================ */

    if (
      transactionType === "labour_request"
    ) {
      await LabourRequest.findByIdAndUpdate(
        transactionId,
        {
          paymentStatus: "paid",
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error(
      "Verify Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

/* =====================================================
   GET PAYMENT BY ID
===================================================== */

const getPaymentById = async (req, res) => {
  try {
    const payment =
      await Payment.findById(req.params.id)
        .populate(
          "booking"
        )
        .populate(
          "labourRequest"
        )
        .populate(
          "payer",
          "fullName email mobile"
        );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (
      payment.payer._id.toString() !==
      req.farmer._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this payment",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error(
      "Get Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
};

/* =====================================================
   MARK CASH PAYMENT AS RECEIVED
===================================================== */

const markCashPaymentReceived = async (
  req,
  res
) => {
  try {
    const {
      transactionType,
      transactionId,
    } = req.body;

    if (!transactionType || !transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "transactionType and transactionId are required",
      });
    }

    let payment;

    if (
      transactionType === "equipment_booking"
    ) {
      const booking =
        await Booking.findById(transactionId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      /* Owner authorization */

      if (
        !req.owner ||
        booking.owner.toString() !==
        req.owner._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the equipment owner can confirm cash payment",
        });
      }

      payment =
        await Payment.findOne({
          transactionType,
          booking: transactionId,
          paymentMethod: "cash",
        });
    }

    else if (
      transactionType === "labour_request"
    ) {
      const labourRequest =
        await LabourRequest.findById(
          transactionId
        );

      if (!labourRequest) {
        return res.status(404).json({
          success: false,
          message:
            "Labour request not found",
        });
      }

      /* Labour authorization */

      if (
        !req.labour ||
        labourRequest.labour.toString() !==
        req.labour._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the assigned labour can confirm cash payment",
        });
      }

      payment =
        await Payment.findOne({
          transactionType,
          labourRequest: transactionId,
          paymentMethod: "cash",
        });
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    if (!payment) {
      if (transactionType === "equipment_booking") {
        const booking = await Booking.findById(transactionId);
        if (booking) {
          payment = await Payment.create({
            transactionType,
            booking: transactionId,
            payer: booking.renter,
            payee: booking.owner,
            payeeModel: "Owner",
            amount: booking.totalAmount,
            currency: "INR",
            paymentMethod: "cash",
            paymentStatus: "cash_pending",
          });
        }
      } else if (transactionType === "labour_request") {
        const labourRequest = await LabourRequest.findById(transactionId);
        if (labourRequest) {
          payment = await Payment.create({
            transactionType,
            labourRequest: transactionId,
            payer: labourRequest.farmer,
            payee: labourRequest.labour,
            payeeModel: "Labour",
            amount: labourRequest.totalAmount,
            currency: "INR",
            paymentMethod: "cash",
            paymentStatus: "cash_pending",
          });
        }
      }
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Cash payment record not found",
      });
    }

    if (
      payment.paymentStatus ===
      "cash_received"
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Cash payment already marked as received",
        payment,
      });
    }

    if (
      payment.paymentStatus !==
      "cash_pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment is not awaiting cash confirmation",
      });
    }

    payment.paymentStatus =
      "cash_received";

    payment.cashReceivedAt =
      new Date();

    if (req.owner) {
      payment.cashReceivedBy =
        req.owner._id;

      payment.cashReceivedByModel =
        "Owner";
    }

    if (req.labour) {
      payment.cashReceivedBy =
        req.labour._id;

      payment.cashReceivedByModel =
        "Labour";
    }

    await payment.save();

    /* ================================================
       SYNC LABOUR REQUEST
    ================================================ */

    if (
      transactionType ===
      "labour_request"
    ) {
      await LabourRequest.findByIdAndUpdate(
        transactionId,
        {
          paymentStatus:
            "cash_received",
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Cash payment marked as received",
      payment,
    });
  } catch (error) {
    console.error(
      "Mark Cash Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to mark cash payment as received",
    });
  }
};

/* =====================================================
   WEBHOOK
===================================================== */

const handlePaymentWebhook = async (
  req,
  res
) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message:
          "Webhook signature missing",
      });
    }

    const rawBody =
      req.rawBody;

    if (!rawBody) {
      return res.status(400).json({
        success: false,
        message:
          "Raw webhook body unavailable",
      });
    }

    const isValid =
      verifyWebhookSignature({
        rawBody,
        signature,
      });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature",
      });
    }

    const event = req.body;

    const paymentEntity =
      event?.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(200).json({
        success: true,
        message:
          "Webhook received",
      });
    }

    const razorpayOrderId =
      paymentEntity.order_id;

    const razorpayPaymentId =
      paymentEntity.id;

    const payment =
      await Payment.findOne({
        razorpayOrderId,
      });

    if (!payment) {
      return res.status(200).json({
        success: true,
        message:
          "Payment record not found",
      });
    }

    /* ================================================
       PAYMENT CAPTURED
    ================================================ */

    if (
      event.event ===
      "payment.captured"
    ) {
      if (
        payment.paymentStatus !==
        "paid"
      ) {
        payment.paymentStatus =
          "paid";

        payment.razorpayPaymentId =
          razorpayPaymentId;

        payment.paidAt =
          new Date();

        await payment.save();

        if (
          payment.transactionType ===
          "labour_request"
        ) {
          await LabourRequest.findByIdAndUpdate(
            payment.labourRequest,
            {
              paymentStatus: "paid",
            }
          );
        }
      }
    }

    /* ================================================
       PAYMENT FAILED
    ================================================ */

    if (
      event.event ===
      "payment.failed"
    ) {
      if (
        payment.paymentStatus !==
        "paid"
      ) {
        payment.paymentStatus =
          "failed";

        payment.failureReason =
          paymentEntity.error_description ||
          "Razorpay payment failed";

        await payment.save();
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully",
    });
  } catch (error) {
    console.error(
      "Payment Webhook Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentById,
  markCashPaymentReceived,
  handlePaymentWebhook,
};