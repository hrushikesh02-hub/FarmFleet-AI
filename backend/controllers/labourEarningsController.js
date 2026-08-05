const Labour = require("../models/Labour");
const LabourRequest = require("../models/labourRequest");

/* ==========================
   LABOUR EARNINGS
========================== */

exports.getEarnings = async (req, res) => {
  try {
    const labourId = req.labour._id;

    const labour = await Labour.findById(labourId);

    if (!labour) {
      return res.status(404).json({
        success: false,
        message: "Labour not found",
      });
    }

    const completedRequests = await LabourRequest.find({
      labour: labourId,
      status: "completed",
    })
      .populate("farmer", "fullName")
      .populate("equipment", "name")
      .sort({ completedAt: -1 });

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(
      startOfToday.getDate() - startOfToday.getDay()
    );

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;

    completedRequests.forEach((request) => {
      const amount = request.totalAmount || 0;
      const completedDate =
        request.completedAt || request.updatedAt;

      totalEarnings += amount;

      if (completedDate >= startOfToday) {
        todayEarnings += amount;
      }

      if (completedDate >= startOfWeek) {
        weekEarnings += amount;
      }

      if (completedDate >= startOfMonth) {
        monthEarnings += amount;
      }
    });

    const earningsHistory = completedRequests.map(
      (request) => ({
        id: request._id,

        farmer:
          request.farmer?.fullName ||
          "Farmer",

        equipment:
          request.equipment?.name ||
          "Equipment",

        amount: request.totalAmount,

        dailyCharges:
          request.dailyCharges,

        startDate: request.startDate,

        endDate: request.endDate,

        completedAt: request.completedAt,

        village: request.village,

        district: request.district,
      })
    );

    return res.status(200).json({
      success: true,

      summary: {
        todayEarnings,

        weekEarnings,

        monthEarnings,

        totalEarnings,

        completedJobs:
          completedRequests.length,

        dailyRate:
          labour.dailyCharges,
      },

      earningsHistory,
    });
  } catch (error) {
    console.error(
      "Labour Earnings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch earnings",
    });
  }
};

/* ==========================
   MONTHLY EARNINGS
========================== */

exports.getMonthlyEarnings =
  async (req, res) => {
    try {
      const labourId =
        req.labour._id;

      const requests =
        await LabourRequest.find({
          labour: labourId,
          status: "completed",
        });

      const monthlyMap = {};

      requests.forEach((request) => {
        const date =
          request.completedAt ||
          request.updatedAt;

        const month =
          new Date(date).toLocaleString(
            "en",
            {
              month: "short",
              year: "numeric",
            }
          );

        if (!monthlyMap[month]) {
          monthlyMap[month] = 0;
        }

        monthlyMap[month] +=
          request.totalAmount;
      });

      const monthlyEarnings =
        Object.entries(monthlyMap).map(
          ([month, amount]) => ({
            month,
            amount,
          })
        );

      return res.status(200).json({
        success: true,
        monthlyEarnings,
      });
    } catch (error) {
      console.error(
        "Monthly Earnings Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch monthly earnings",
      });
    }
  };