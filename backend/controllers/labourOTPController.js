const Labour = require("../models/Labour");
const LabourOTP = require("../models/LabourOTP");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpGenerator = require("otp-generator");

const { transporter } = require("../config/mail");

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

    const existingLabour = await Labour.findOne({
      email,
    });

    if (existingLabour) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    await LabourOTP.deleteMany({ email });

    await LabourOTP.create({
      email,
      otp,
      expiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      ),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to: email,

      subject: "FarmFleet Labour Email Verification",

      html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>👷 FarmFleet Labour Verification</h2>

        <p>Your verification code is:</p>

        <h1 style="color:#16a34a;">
          ${otp}
        </h1>

        <p>
          This OTP is valid for
          <strong>5 minutes</strong>.
        </p>

        <p>
          If you didn't request this,
          please ignore this email.
        </p>
      </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "Labour Send OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================
   VERIFY OTP + REGISTER LABOUR
========================== */

exports.verifyOTP = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      primarySkill,
      experience,
      dailyCharges,
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
      !primarySkill ||
      !experience ||
      dailyCharges === undefined ||
      !password ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otpRecord =
      await LabourOTP.findOne({
        email,
      });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    if (
      otpRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const existingLabour =
      await Labour.findOne({
        $or: [
          { email },
          { mobile },
        ],
      });

    if (existingLabour) {
      return res.status(400).json({
        success: false,
        message:
          "Labour already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const labour =
      await Labour.create({
        fullName,
        mobile,
        email,
        village,
        district,
        state,
        primarySkill,
        experience,
        dailyCharges,
        password: hashedPassword,
      });

    await LabourOTP.deleteMany({
      email,
    });

    const token = jwt.sign(
      {
        labourId: labour._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,

      message:
        "Labour registered successfully",

      token,

      labour: {
        id: labour._id,
        fullName:
          labour.fullName,
        email: labour.email,
        mobile:
          labour.mobile,
        village:
          labour.village,
        district:
          labour.district,
        state:
          labour.state,
        primarySkill:
          labour.primarySkill,
        experience:
          labour.experience,
        dailyCharges:
          labour.dailyCharges,
        availability:
          labour.availability,
        profileImage:
          labour.profileImage,
      },
    });
  } catch (error) {
    console.error(
      "Labour Verify OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};