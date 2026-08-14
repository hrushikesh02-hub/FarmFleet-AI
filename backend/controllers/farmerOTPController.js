const Farmer = require("../models/Farmer");
const FarmerOTP = require("../models/FarmerOTP");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpGenerator = require("otp-generator");

const { sendEmail } = require("../config/mail");
const { buildOTPTemplate } = require("../templates/emailTemplate");

/* ==========================
   SEND OTP
========================== */

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existingFarmer =
      await Farmer.findOne({
        email,
      });

    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered",
      });
    }

    const otp = otpGenerator.generate(
      6,
      {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      }
    );

    await FarmerOTP.deleteMany({
      email,
    });

    await FarmerOTP.create({
      email,
      otp,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    await sendEmail({
      to: email,
      subject: "FarmFleet AI — Email Verification Code",
      html: buildOTPTemplate({
        role: "Renter (Farmer)",
        otp,
        expiryMinutes: 5,
      }),
    });

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "Send OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================
   VERIFY OTP + REGISTER FARMER
========================== */

exports.verifyOTP = async (
  req,
  res
) => {
  try {
    const {
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      password,
      otp,
    } = req.body;

    if (
      !fullName ||
      !mobile ||
      !email ||
      !village ||
      !district ||
      !state ||
      !password ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }

    const otpRecord =
      await FarmerOTP.findOne({
        email,
      });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "OTP not found",
      });
    }

    if (
      otpRecord.expiresAt <
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP",
      });
    }

    const existingFarmer =
      await Farmer.findOne({
        $or: [
          { email },
          { mobile },
        ],
      });

    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const farmer =
      await Farmer.create({
        fullName,
        mobile,
        email,
        village,
        district,
        state,
        password:
          hashedPassword,
      });

    await FarmerOTP.deleteMany({
      email,
    });

    const token = jwt.sign(
      {
        farmerId: farmer._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,

      message:
        "Farmer registered successfully",

      token,

      farmer: {
        id: farmer._id,
        fullName:
          farmer.fullName,
        email: farmer.email,
        mobile:
          farmer.mobile,
        village:
          farmer.village,
        district:
          farmer.district,
        state: farmer.state,
        profileImage:
          farmer.profileImage,
      },
    });
  } catch (error) {
    console.error(
      "Verify OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};