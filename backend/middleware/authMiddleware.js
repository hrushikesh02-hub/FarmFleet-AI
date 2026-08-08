const jwt = require("jsonwebtoken");
const Farmer = require("../models/Farmer");

const protect = async (req, res, next) => {
  try {
    let token;

    // ==============================
    // 1. Get token from Authorization header
    // ==============================
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // ==============================
    // 2. Check token
    // ==============================
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // ==============================
    // 3. Verify JWT
    // ==============================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ==============================
    // 4. Find farmer
    // ==============================
    const farmer = await Farmer.findById(decoded.farmerId).select(
      "-password"
    );

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: "Farmer not found",
      });
    }

    // ==============================
    // 5. Attach farmer to request
    // ==============================
    req.farmer = farmer;

    // ==============================
    // 6. Continue
    // ==============================
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;