const Labour = require("../models/Labour");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const geocodeLocation = require("../utils/geocodeLocation");

const Booking = require("../models/Booking");

/* ==========================
   REGISTER LABOUR
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
      primarySkill,
      experience,
      dailyCharges,
      password,
    } = req.body;

    const existingEmail = await Labour.findOne({
      email,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingMobile = await Labour.findOne({
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

    const locationStr = [village, district, state].filter(Boolean).join(", ");
    let coordinates = { lat: 0, lng: 0 };
    if (locationStr) {
      const geoResult = await geocodeLocation(locationStr);
      if (geoResult) {
        coordinates = geoResult;
      }
    }

    const labour = await Labour.create({
      fullName,
      mobile,
      email,
      village,
      district,
      state,
      location: locationStr,
      coordinates,
      primarySkill,
      experience,
      dailyCharges,
      password: hashedPassword,
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
      message: "Labour account created successfully",
      token,
      labour: {
        id: labour._id,
        fullName: labour.fullName,
        email: labour.email,
        mobile: labour.mobile,
        village: labour.village,
        district: labour.district,
        state: labour.state,
        location: labour.location,
        coordinates: labour.coordinates,
        primarySkill: labour.primarySkill,
        experience: labour.experience,
        dailyCharges: labour.dailyCharges,
        profileImage: labour.profileImage,
        availability: labour.availability,
        rating: labour.rating,
      },
    });
  } catch (error) {
    console.error(
      "Labour Signup Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   LOGIN LABOUR
========================== */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const labour = await Labour.findOne({
      email,
    });

    if (!labour) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      labour.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        labourId: labour._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      labour: {
        id: labour._id,
        fullName: labour.fullName,
        email: labour.email,
        mobile: labour.mobile,
        village: labour.village,
        district: labour.district,
        state: labour.state,
        location: labour.location || [labour.village, labour.district, labour.state].filter(Boolean).join(", "),
        coordinates: labour.coordinates || { lat: 0, lng: 0 },
        primarySkill: labour.primarySkill,
        experience: labour.experience,
        dailyCharges: labour.dailyCharges,
        profileImage: labour.profileImage,
        availability: labour.availability,
        rating: labour.rating,
        completedJobs: labour.completedJobs,
      },
    });
  } catch (error) {
    console.error(
      "Labour Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ==========================
   UPDATE LABOUR PROFILE
========================== */

const updateProfile = async (req, res) => {
  try {
    const labour = await Labour.findById(req.labour._id);

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    const locationChanged = req.body.village || req.body.district || req.body.state || req.body.location;
    labour.fullName = req.body.fullName || labour.fullName;
    labour.mobile = req.body.mobile || labour.mobile;
    labour.email = req.body.email || labour.email;
    labour.village = req.body.village || labour.village;
    labour.district = req.body.district || labour.district;
    labour.state = req.body.state || labour.state;

    if (locationChanged) {
      const locationStr = req.body.location || [labour.village, labour.district, labour.state].filter(Boolean).join(", ");
      labour.location = locationStr;
      const geoResult = await geocodeLocation(locationStr);
      if (geoResult) {
        labour.coordinates = geoResult;
      }
    }

    labour.primarySkill =
      req.body.primarySkill || labour.primarySkill;
    labour.experience =
      req.body.experience || labour.experience;
    labour.dailyCharges =
      req.body.dailyCharges || labour.dailyCharges;
    labour.bio = req.body.bio || labour.bio;

    // Normalize availability value
    if (req.body.availability) {
      const availabilityMap = {
        available: "Available",
        busy: "Busy",
        "on leave": "On Leave",
        on_leave: "On Leave",
      };

      const normalizedAvailability =
        availabilityMap[
          req.body.availability.toLowerCase().trim()
        ];

      if (!normalizedAvailability) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid availability value. Allowed values are: Available, Busy, On Leave.",
        });
      }

      labour.availability = normalizedAvailability;
    }

    if (req.body.preferredLanguage && ["en", "hi", "mr", "gu", "ta", "te", "kn", "pa"].includes(req.body.preferredLanguage)) {
      labour.preferredLanguage = req.body.preferredLanguage;
    }

    console.log("Updated Availability:", labour.availability);

    const updatedLabour = await labour.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      labour: {
        id: updatedLabour._id,
        fullName: updatedLabour.fullName,
        email: updatedLabour.email,
        mobile: updatedLabour.mobile,
        village: updatedLabour.village,
        district: updatedLabour.district,
        state: updatedLabour.state,
        location: updatedLabour.location || [updatedLabour.village, updatedLabour.district, updatedLabour.state].filter(Boolean).join(", "),
        coordinates: updatedLabour.coordinates || { lat: 0, lng: 0 },
        primarySkill: updatedLabour.primarySkill,
        experience: updatedLabour.experience,
        dailyCharges: updatedLabour.dailyCharges,
        availability: updatedLabour.availability,
        bio: updatedLabour.bio,
        profileImage: updatedLabour.profileImage,
        preferredLanguage: updatedLabour.preferredLanguage || "en",
      },
    });
  } catch (error) {
    console.error("Labour Profile Update Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/* ==========================
   UPLOAD PROFILE PHOTO
========================== */

const uploadPhoto = async (req, res) => {
  try {
    const labour = await Labour.findById(
      req.labour._id
    );

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
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
          folder:
            "farmfleet/labours",
        }
      );

    labour.profileImage =
      uploadedImage.secure_url;

    await labour.save();

    return res.status(200).json({
      success: true,
      message:
        "Photo uploaded successfully",
      profileImage:
        labour.profileImage,
    });
  } catch (error) {
    console.error(
      "Labour Photo Upload Error:",
      error
    );

    return res.status(500).json({
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
    const labour = await Labour.findById(
      req.labour._id
    );

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    await Labour.findByIdAndDelete(
      req.labour._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Account deleted successfully",
    });
  } catch (error) {
    console.error(
      "Labour Delete Account Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete account",
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

    const labour = await Labour.findById(
      req.labour._id
    );

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      labour.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    labour.password =
      hashedPassword;

    await labour.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Labour Change Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change password",
    });
  }
};

/* ==========================
   DASHBOARD STATS
========================== */

const getDashboardStats = async (
  req,
  res
) => {
  try {
    const labourId =
      req.labour._id;

    const acceptedJobs =
      await Booking.countDocuments({
        labour: labourId,
        labourStatus: "accepted",
      });

    const pendingJobs =
      await Booking.countDocuments({
        labour: labourId,
        labourStatus: "pending",
      });

    const completedJobs =
      await Booking.countDocuments({
        labour: labourId,
        labourStatus: "completed",
      });

    const labour =
      await Labour.findById(
        labourId
      );

    res.status(200).json({
      success: true,

      acceptedJobs,

      pendingJobs,

      completedJobs,

      totalReviews:
        labour.totalReviews,

      rating:
        labour.rating,

      dailyCharges:
        labour.dailyCharges,

      availability:
        labour.availability,
    });
  } catch (error) {
    console.error(
      "Labour Dashboard Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard statistics",
    });
  }
};

/* ==========================
   PUBLIC LABOURS
========================== */

const getPublicLabours = async (
  req,
  res
) => {
  try {
    const labours = await Labour.find({})
      .select("-password -__v")
      .sort({
        rating: -1,
        experience: -1,
      });

    const formattedLabours =
      labours.map((labour) => {
        return {
          _id: labour._id,
          fullName: labour.fullName,
          profileImage:
            labour.profileImage || "",
          mobile: labour.mobile,
          primarySkill:
            labour.primarySkill,
          experience:
            labour.experience,
          dailyCharges:
            labour.dailyCharges,
          village: labour.village,
          district: labour.district,
          state: labour.state,
          location: labour.location || [labour.village, labour.district, labour.state].filter(Boolean).join(", "),
          coordinates: labour.coordinates || { lat: 0, lng: 0 },
          availability:
            labour.availability,
          rating:
            labour.rating || 0,
          totalReviews:
            labour.totalReviews || 0,
          bio: labour.bio || "",
          completedJobs:
            labour.completedJobs || 0,
        };
      });

    return res.status(200).json({
      success: true,
      count:
        formattedLabours.length,
      labours: formattedLabours,
    });
  } catch (error) {
    console.error(
      "Get Public Labours Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch labour profiles",
    });
  }
};

/* ==========================
   GET PUBLIC LABOUR BY ID
========================== */

const getPublicLabourById = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id).select("-password -__v");

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    return res.status(200).json({
      success: true,
      labour: {
        _id: labour._id,
        fullName: labour.fullName,
        profileImage: labour.profileImage || "",
        mobile: labour.mobile,
        email: labour.email,
        primarySkill: labour.primarySkill,
        experience: labour.experience,
        dailyCharges: labour.dailyCharges,
        village: labour.village,
        district: labour.district,
        state: labour.state,
        location: labour.location || [labour.village, labour.district, labour.state].filter(Boolean).join(", "),
        coordinates: labour.coordinates || { lat: 0, lng: 0 },
        availability: labour.availability,
        rating: labour.rating || 0,
        totalReviews: labour.totalReviews || 0,
        bio: labour.bio || "",
        completedJobs: labour.completedJobs || 0,
      },
    });
  } catch (error) {
    console.error("Get Public Labour By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch labour profile",
    });
  }
};
/* ==========================
   EXPORTS
========================== */

module.exports = {
  signup,
  login,
  updateProfile,
  uploadPhoto,
  deleteAccount,
  changePassword,
  getDashboardStats,
  getPublicLabours,
  getPublicLabourById,
};