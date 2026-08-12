const Farmer = require("../models/Farmer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

/* ==========================
   REGISTER FARMER
========================== */

const signup = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      password,
    } = req.body;

    const existingEmail = await Farmer.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingMobile = await Farmer.findOne({ mobile });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const farmer = await Farmer.create({
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { farmerId: farmer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      farmer: {
        id: farmer._id,
        fullName: farmer.fullName,
        email: farmer.email,
        mobile: farmer.mobile,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        bio: farmer.bio,
        profileImage: farmer.profileImage,
        preferredLanguage: farmer.preferredLanguage || "en",
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   LOGIN FARMER
========================== */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const farmer = await Farmer.findOne({ email });

    if (!farmer) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      farmer.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { farmerId: farmer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      farmer: {
        id: farmer._id,
        fullName: farmer.fullName,
        email: farmer.email,
        mobile: farmer.mobile,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        bio: farmer.bio,
        profileImage: farmer.profileImage,
        preferredLanguage: farmer.preferredLanguage || "en",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   UPDATE PROFILE
========================== */

const updateProfile = async (req, res) => {
  try {
    const farmer = await Farmer.findById(
      req.farmer._id
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    farmer.fullName =
      req.body.fullName || farmer.fullName;

    farmer.mobile =
      req.body.mobile || farmer.mobile;

    farmer.email =
      req.body.email || farmer.email;

    farmer.village =
      req.body.village || farmer.village;

    farmer.district =
      req.body.district || farmer.district;

    farmer.state =
      req.body.state || farmer.state;

    farmer.bio =
      req.body.bio !== undefined ? req.body.bio : farmer.bio;

    if (req.body.preferredLanguage && ["en", "hi", "mr", "gu", "ta", "te", "kn", "pa"].includes(req.body.preferredLanguage)) {
      farmer.preferredLanguage = req.body.preferredLanguage;
    }

    const updatedFarmer = await farmer.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      farmer: {
        id: updatedFarmer._id,
        fullName: updatedFarmer.fullName,
        email: updatedFarmer.email,
        mobile: updatedFarmer.mobile,
        village: updatedFarmer.village,
        district: updatedFarmer.district,
        state: updatedFarmer.state,
        bio: updatedFarmer.bio,
        profileImage: updatedFarmer.profileImage,
        preferredLanguage: updatedFarmer.preferredLanguage || "en",
      },
    });
  } catch (error) {
    console.error(
      "Update Profile Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/* ==========================
   UPLOAD PROFILE PHOTO
========================== */

const uploadPhoto = async (req, res) => {
  try {
    const farmer = await Farmer.findById(
      req.farmer._id
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;

    const uploadedImage =
      await cloudinary.uploader.upload(
        base64,
        {
          folder: "farmfleet/farmers",
        }
      );

    farmer.profileImage =
      uploadedImage.secure_url;

    await farmer.save();

    res.status(200).json({
      success: true,
      message:
        "Photo uploaded successfully",
      profileImage:
        farmer.profileImage,
    });
  } catch (error) {
    console.error(
      "Farmer Photo Upload Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

/* ==========================
   DELETE ACCOUNT
========================== */

const deleteAccount = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.farmer._id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    await Farmer.findByIdAndDelete(req.farmer._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

/* ==========================
   CHANGE PASSWORD
========================== */

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    const farmer = await Farmer.findById(
      req.farmer._id
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      farmer.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    farmer.password = hashedPassword;

    await farmer.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change Password Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const Booking = require("../models/Booking");

const getBookingStats = async (
  req,
  res
) => {
  try {
    const farmerId =
      req.farmer._id;

    const bookings =
      await Booking.find({
        renter: farmerId,
      });

    const total =
      bookings.length;

    const active =
      bookings.filter(
        (booking) =>
          booking.status ===
            "pending" ||
          booking.status ===
            "accepted"
      ).length;

    const completed =
      bookings.filter(
        (booking) =>
          booking.status ===
          "completed"
      ).length;

    res.status(200).json({
      total,
      active,
      completed,
    });
  } catch (error) {
    console.error(
      "Booking Stats Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch booking stats",
    });
  }
};

module.exports = {
  signup,
  login,
  updateProfile,
  uploadPhoto,
  deleteAccount,
  changePassword,
  getBookingStats,
};