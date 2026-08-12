'use strict';

const { sendEmail } = require("../config/mail");
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

    // 3. Construct HTML Email using Project's Email Design
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2E7D32; margin-top: 0; margin-bottom: 8px;">🌾 FarmFleet AI</h2>
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px; font-weight: 600;">New Contact Inquiry</h3>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="font-size: 14px; color: #334155; margin: 8px 0;"><strong>Name:</strong> ${cleanName}</p>
      <p style="font-size: 14px; color: #334155; margin: 8px 0;"><strong>Email:</strong> ${cleanEmail}</p>
      <p style="font-size: 14px; color: #334155; margin: 8px 0;"><strong>User Role:</strong> ${userRole}</p>
      ${authenticatedUser ? `<p style="font-size: 14px; color: #334155; margin: 8px 0;"><strong>User ID:</strong> ${authenticatedUser._id}</p>` : ""}
      <p style="font-size: 14px; color: #334155; margin: 8px 0;"><strong>Subject:</strong> ${cleanSubject}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="font-size: 14px; color: #334155; margin-bottom: 8px;"><strong>Message:</strong></p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6; border: 1px solid #f1f5f9;">${cleanMessage}</div>
      <br />
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        Sent via FarmFleet AI Contact System
      </p>
    </div>
    `;

    // 4. Send Email using Existing Configured Mail Service
    await sendEmail({
      to: "officialfarmfleet@gmail.com",
      subject: `[FarmFleet Contact] ${cleanSubject}`,
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
