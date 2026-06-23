const Owner = require("../models/Owner");
const OwnerOTP = require("../models/OwnerOTP");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpGenerator = require("otp-generator");

const transporter = require("../config/mail");

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

    const existingOwner =
      await Owner.findOne({
        email,
      });

    if (existingOwner) {
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

    await OwnerOTP.deleteMany({
      email,
    });

    await OwnerOTP.create({
      email,
      otp,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to: email,

      subject:
        "FarmFleet Email Verification",

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🚜 FarmFleet Email Verification</h2>

          <p>
            Your verification code is:
          </p>

          <h1 style="color: #16a34a;">
            ${otp}
          </h1>

          <p>
            This OTP is valid for
            <strong>5 minutes</strong>.
          </p>

          <p>
            If you did not request this,
            please ignore this email.
          </p>
        </div>
      `,
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
   VERIFY OTP + REGISTER OWNER
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
      await OwnerOTP.findOne({
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

    const existingOwner =
      await Owner.findOne({
        $or: [
          { email },
          { mobile },
        ],
      });

    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message:
          "Owner already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const owner =
      await Owner.create({
        fullName,
        mobile,
        email,
        village,
        district,
        state,
        password:
          hashedPassword,
      });

    await OwnerOTP.deleteMany({
      email,
    });

    const token = jwt.sign(
      {
        ownerId: owner._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,

      message:
        "Owner registered successfully",

      token,

      owner: {
        id: owner._id,
        fullName:
          owner.fullName,
        email: owner.email,
        mobile:
          owner.mobile,
        village:
          owner.village,
        district:
          owner.district,
        state: owner.state,
        profileImage:
          owner.profileImage,
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