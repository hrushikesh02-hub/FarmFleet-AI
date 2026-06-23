require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const farmerRoutes = require("./routes/farmerRoutes");
const farmerOTPRoutes = require("./routes/farmerOTPRoutes");

const ownerRoutes = require("./routes/ownerRoutes");
const ownerOTPRoutes = require("./routes/ownerOTPRoutes");

const equipmentRoutes = require("./routes/equipmentRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

/* ==========================
   CONNECT DATABASE
========================== */

connectDB();

/* ==========================
   MIDDLEWARE
========================== */

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ==========================
   ROUTES
========================== */

// Farmer Routes
app.use(
  "/api/farmer",
  farmerRoutes
);

// Farmer OTP Routes
app.use(
  "/api/farmer",
  farmerOTPRoutes
);

// Owner Routes
app.use(
  "/api/owner",
  ownerRoutes
);

// Owner OTP Routes
app.use(
  "/api/owner",
  ownerOTPRoutes
);

// Dashboard Routes
app.use(
  "/api/owner/dashboard",
  dashboardRoutes
);

// Equipment Routes
app.use(
  "/api/equipment",
  equipmentRoutes
);

// Booking Routes
app.use(
  "/api/booking",
  bookingRoutes
);

// Earnings Routes
app.use(
  "/api/earnings",
  earningsRoutes
);

// Reviews Routes
app.use(
  "/api/reviews",
  reviewRoutes
);

/* ==========================
   TEST ROUTE
========================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚜 FarmFleet Backend Running",
  });
});

/* ==========================
   404 HANDLER
========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ==========================
   SERVER
========================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});