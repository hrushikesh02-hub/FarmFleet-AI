const jwt = require("jsonwebtoken");
const Owner = require("../models/Owner");

const protectOwner = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    console.log("OWNER AUTH HEADER:", !!req.headers.authorization);

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      console.log("OWNER ID:", decoded.ownerId);

      // Find Owner
      req.owner = await Owner.findById(
        decoded.ownerId
      ).select("-password");

      if (!req.owner) {
        return res.status(401).json({
          success: false,
          message: "Owner not found",
        });
      }

      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
  } catch (error) {
    console.error("Owner Auth Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = protectOwner;