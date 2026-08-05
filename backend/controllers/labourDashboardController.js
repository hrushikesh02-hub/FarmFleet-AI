const Labour = require("../models/Labour");
const LabourRequest = require("../models/labourRequest");

/* ==========================
   LABOUR DASHBOARD
========================== */

exports.getDashboard = async (req, res) => {
  try {
    const labourId = req.labour._id;

    const labour = await Labour.findById(labourId);

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    const pendingRequests = await LabourRequest.countDocuments({
      labour: labourId,
      status: "pending",
    });

    const acceptedJobs = await LabourRequest.countDocuments({
      labour: labourId,
      status: "accepted",
    });

    const completedJobs = await LabourRequest.countDocuments({
      labour: labourId,
      status: "completed",
    });

    const rejectedJobs = await LabourRequest.countDocuments({
      labour: labourId,
      status: "rejected",
    });

    const totalJobs =
      pendingRequests +
      acceptedJobs +
      completedJobs +
      rejectedJobs;

    const completedRequests =
      await LabourRequest.find({
        labour: labourId,
        status: "completed",
      });

    const totalEarnings =
      completedRequests.reduce(
        (sum, request) => sum + request.totalAmount,
        0
      );

    const recentRequests =
      await LabourRequest.find({
        labour: labourId,
      })
        .populate(
          "farmer",
          "fullName profileImage village district"
        )
        .populate(
          "equipment",
          "name image"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    return res.status(200).json({
      success: true,

      dashboard: {
        labour: {
          id: labour._id,
          fullName: labour.fullName,
          email: labour.email,
          mobile: labour.mobile,
          profileImage: labour.profileImage,

          primarySkill: labour.primarySkill,
          experience: labour.experience,
          dailyCharges: labour.dailyCharges,

          availability: labour.availability,

          rating: labour.rating,

          totalReviews: labour.totalReviews,
        },

        statistics: {
          totalJobs,

          pendingRequests,

          acceptedJobs,

          completedJobs,

          rejectedJobs,

          totalEarnings,
        },

        recentRequests,
      },
    });
  } catch (error) {
    console.error(
      "Labour Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard",
    });
  }
};