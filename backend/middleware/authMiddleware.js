const jwt = require("jsonwebtoken");
const Farmer = require("../models/Farmer");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find farmer
    const farmer = await Farmer.findById(
      decoded.farmerId
    ).select("-password");

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: "Farmer not found",
      });
    }

    // Attach farmer to request
    req.farmer = farmer;

    next();
  } catch (error) {
    console.error("Auth Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;