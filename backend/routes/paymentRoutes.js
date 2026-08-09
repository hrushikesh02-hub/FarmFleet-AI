const express = require("express");

const router = express.Router();

const farmerAuth = require("../middleware/authMiddleware");
const labourAuth = require("../middleware/labourAuth");
const ownerAuth = require("../middleware/ownerAuthMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
  getPaymentById,
  markCashPaymentReceived,
  handlePaymentWebhook,
} = require("../controllers/paymentController");

/* =====================================================
   FARMER PAYMENT ROUTES
===================================================== */

router.post(
  "/create-order",
  farmerAuth,
  createPaymentOrder
);

router.post(
  "/verify",
  farmerAuth,
  verifyPayment
);

router.get(
  "/:id",
  farmerAuth,
  getPaymentById
);

/* =====================================================
   EQUIPMENT CASH PAYMENT
   Owner confirms cash received
===================================================== */

router.post(
  "/cash/mark-received/equipment",
  ownerAuth,
  (req, res, next) => {
    req.body.transactionType =
      "equipment_booking";

    markCashPaymentReceived(
      req,
      res,
      next
    );
  }
);

/* =====================================================
   LABOUR CASH PAYMENT
   Labour confirms cash received
===================================================== */

router.post(
  "/cash/mark-received/labour",
  labourAuth,
  (req, res, next) => {
    req.body.transactionType =
      "labour_request";

    markCashPaymentReceived(
      req,
      res,
      next
    );
  }
);

/* =====================================================
   RAZORPAY WEBHOOK
===================================================== */

router.post(
  "/webhook",
  handlePaymentWebhook
);

module.exports = router;