'use strict';

const { sendEmail } = require("../config/mail");
const { buildContactEmailTemplate } = require("../templates/emailTemplate");
const jwt = require("jsonwebtoken");
const Farmer = require("../models/Farmer");
const Owner = require("../models/Owner");
const Labour = require("../models/Labour");

/**
 * Handle Contact Form Submissions
 * POST /api/contact
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full Name is required.",
      });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email Address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject is required.",
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name is too long (maximum 100 characters).",
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject is too long (maximum 200 characters).",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long (maximum 5000 characters).",
      });
    }

    // 2. Identify Authenticated User & Role from JWT Token (if present)
    let userRole = "Guest User";
    let authenticatedUser = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.farmerId) {
          const farmer = await Farmer.findById(decoded.farmerId).select("-password");
          if (farmer) {
            userRole = "Renter (Farmer)";
            authenticatedUser = farmer;
          }
        } else if (decoded.ownerId) {
          const owner = await Owner.findById(decoded.ownerId).select("-password");
          if (owner) {
            userRole = "Owner";
            authenticatedUser = owner;
          }
        } else if (decoded.labourId) {
          const labour = await Labour.findById(decoded.labourId).select("-password");
          if (labour) {
            userRole = "Labour";
            authenticatedUser = labour;
          }
        }
      } catch (tokenErr) {
        // Token invalid or expired — fall back silently to Guest User
      }
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // 3. Construct Official FarmFleet AI HTML Email
    const emailHtml = buildContactEmailTemplate({
      senderName: cleanName,
      senderEmail: cleanEmail,
      userRole,
      userId: authenticatedUser ? authenticatedUser._id.toString() : null,
      subject: cleanSubject,
      message: cleanMessage,
    });

    // 4. Send Email using Configured Mail Service
    await sendEmail({
      to: "officialfarmfleet@gmail.com",
      subject: `[FarmFleet AI Contact] ${cleanSubject}`,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Thank you for reaching out. Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("❌ Contact Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message due to a server error. Please try again later.",
    });
  }
};

module.exports = {
  submitContact,
};
