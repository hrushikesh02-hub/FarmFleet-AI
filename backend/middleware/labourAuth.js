const jwt = require("jsonwebtoken");
const Labour = require("../models/Labour");

const labourAuth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Remove Bearer prefix
    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const labour = await Labour.findById(
      decoded.labourId
    ).select("-password");

    if (!labour) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Labour not found.",
      });
    }

    req.labour = labour;

    next();
  } catch (error) {
    console.error(
      "Labour Auth Middleware Error:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = labourAuth;