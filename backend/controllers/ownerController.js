const Owner = require("../models/Owner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const Equipment = require("../models/Equipment");
const Booking = require("../models/Booking");
/* ==========================
   REGISTER OWNER
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

    const existingEmail = await Owner.findOne({
      email,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingMobile = await Owner.findOne({
      mobile,
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const owner = await Owner.create({
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      password: hashedPassword,
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

    res.status(201).json({
      success: true,
      message: "Owner account created successfully",
      token,
      owner: {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        mobile: owner.mobile,
        village: owner.village,
        district: owner.district,
        state: owner.state,
        profileImage: owner.profileImage,
      },
    });
  } catch (error) {
    console.error("Owner Signup Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   LOGIN OWNER
========================== */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const owner = await Owner.findOne({
      email,
    });

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      owner.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        ownerId: owner._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      owner: {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
        mobile: owner.mobile,
        village: owner.village,
        district: owner.district,
        state: owner.state,
        profileImage: owner.profileImage,
      },
    });
  } catch (error) {
    console.error("Owner Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   UPDATE OWNER PROFILE
========================== */

const updateProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(
      req.owner._id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    owner.fullName =
      req.body.fullName || owner.fullName;

    owner.mobile =
      req.body.mobile || owner.mobile;

    owner.email =
      req.body.email || owner.email;

    owner.village =
      req.body.village || owner.village;

    owner.district =
      req.body.district || owner.district;

    owner.state =
      req.body.state || owner.state;

    owner.bio =
      req.body.bio || owner.bio;

    const updatedOwner = await owner.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      owner: {
        id: updatedOwner._id,
        fullName: updatedOwner.fullName,
        email: updatedOwner.email,
        mobile: updatedOwner.mobile,
        village: updatedOwner.village,
        district: updatedOwner.district,
        state: updatedOwner.state,
        bio: updatedOwner.bio,
        profileImage:
          updatedOwner.profileImage,
      },
    });
  } catch (error) {
    console.error(
      "Owner Profile Update Error:",
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
    const owner = await Owner.findById(
      req.owner._id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
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
          folder: "farmfleet/owners",
        }
      );

    owner.profileImage =
      uploadedImage.secure_url;

    await owner.save();

    res.status(200).json({
      success: true,
      message:
        "Photo uploaded successfully",
      profileImage:
        owner.profileImage,
    });
  } catch (error) {
    console.error(
      "Photo Upload Error:",
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
    const owner = await Owner.findById(req.owner._id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    await Owner.findByIdAndDelete(req.owner._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(
      "Owner Delete Account Error:",
      error
    );

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

    const owner = await Owner.findById(
      req.owner._id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      owner.password
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

    owner.password = hashedPassword;

    await owner.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Owner Change Password Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

/* ==========================
   EQUIPMENT STATS
========================== */

const getEquipmentStats = async (
  req,
  res
) => {
  try {
    const ownerId = req.owner._id;

    const equipments =
      await Equipment.find({
        owner: ownerId,
      });

    const bookings =
      await Booking.find({
        owner: ownerId,
      });

    const total = equipments.length;

    const active = equipments.filter(
      (equipment) =>
        equipment.status === "Active"
    ).length;

    const rented = bookings.filter(
      (booking) =>
        booking.status === "accepted"
    ).length;

    const available = Math.max(
      total - rented,
      0
    );

    res.status(200).json({
      success: true,
      total,
      active,
      available,
      rented,
    });
  } catch (error) {
    console.error(
      "Equipment Stats Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch equipment stats",
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
  getEquipmentStats,
};