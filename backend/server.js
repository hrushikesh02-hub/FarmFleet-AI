require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

/* ==========================
   FARMER ROUTES
========================== */

const farmerRoutes = require("./routes/farmerRoutes");
const farmerOTPRoutes = require("./routes/farmerOTPRoutes");

/* ==========================
   OWNER ROUTES
========================== */

const ownerRoutes = require("./routes/ownerRoutes");
const ownerOTPRoutes = require("./routes/ownerOTPRoutes");

/* ==========================
   LABOUR ROUTES
========================== */

const labourRoutes = require("./routes/labourRoutes");
const labourRequestRoutes = require("./routes/labourRequestRoutes");
const labourReviewRoutes = require("./routes/labourReviewRoutes");
const labourEarningsRoutes = require("./routes/labourEarningsRoutes");

/* ==========================
   COMMON ROUTES
========================== */

const equipmentRoutes = require("./routes/equipmentRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const earningsRoutes = require("./routes/earningsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

/* ==========================
   AI ROUTES
========================== */

const aiRoutes = require("./routes/aiRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

/* ==========================
   JOBS
========================== */

const {
   startWeatherMonitorJob,
} = require("./jobs/weatherJob");

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
   FARMER ROUTES
========================== */

app.use("/api/farmer", farmerRoutes);
app.use("/api/farmer", farmerOTPRoutes);

/* ==========================
   OWNER ROUTES
========================== */

app.use("/api/owner", ownerRoutes);
app.use("/api/owner", ownerOTPRoutes);
app.use("/api/owner/dashboard", dashboardRoutes);

/* ==========================
   LABOUR ROUTES
========================== */

app.use("/api/labour", labourRoutes);

// Labour Request Routes
// Frontend uses: /api/labour-request/*
app.use("/api/labour-request", labourRequestRoutes);

// Labour Reviews
app.use("/api/labour/reviews", labourReviewRoutes);

// Labour Earnings
app.use("/api/labour/earnings", labourEarningsRoutes);

/* ==========================
   EQUIPMENT ROUTES
========================== */

app.use("/api/equipment", equipmentRoutes);

/* ==========================
   BOOKING ROUTES
========================== */

app.use("/api/booking", bookingRoutes);

/* ==========================
   OWNER EARNINGS
========================== */

app.use("/api/earnings", earningsRoutes);

/* ==========================
   OWNER REVIEWS
========================== */

app.use("/api/reviews", reviewRoutes);

/* ==========================
   AI ROUTES
========================== */

app.use("/api/ai", aiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/pdf", pdfRoutes);

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
   console.log(`🚀 Server running on port ${PORT}`);

   // Initialize Weather Monitoring Job (non-blocking)
   try {
      startWeatherMonitorJob();
      console.log("🌦️  Weather Monitor Job Started");
      console.log("✅ Weather monitoring initialized successfully.");
   } catch (error) {
      console.error("❌ Failed to start Weather Monitor Job:", error.message);
   }
});