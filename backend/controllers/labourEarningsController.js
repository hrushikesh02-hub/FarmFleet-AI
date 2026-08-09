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

    const pendingJobs = await LabourRequest.countDocuments({
      labour: labourId,
      status: "pending",
    });

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
    let totalDaysWorked = 0;

    completedRequests.forEach((request) => {
      const amount = request.totalAmount || 0;
      const completedDate = new Date(
        request.completedAt || request.updatedAt || request.createdAt
      );

      totalEarnings += amount;

      if (request.startDate && request.endDate) {
        const days = Math.max(
          1,
          Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 86400000) + 1
        );
        totalDaysWorked += days;
      } else {
        totalDaysWorked += 1;
      }

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

    const averageDailyIncome = totalDaysWorked > 0 ? Math.round(totalEarnings / totalDaysWorked) : (labour.dailyCharges || 0);

    const earningsHistory = completedRequests.map(
      (request) => ({
        id: request._id,
        farmer: request.farmer?.fullName || "Farmer",
        equipment: request.equipment?.name || "Equipment",
        amount: request.totalAmount,
        dailyCharges: request.dailyCharges,
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
        thisMonth: monthEarnings,
        monthEarnings,
        totalEarnings,
        completedJobs: completedRequests.length,
        pendingJobs,
        averageDailyIncome,
        dailyRate: labour.dailyCharges,
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

exports.getMonthlyEarnings = async (req, res) => {
  try {
    const labourId = req.labour._id;

    const requests = await LabourRequest.find({
      labour: labourId,
      status: "completed",
    });

    const monthlyMap = {};

    requests.forEach((request) => {
      const date = new Date(
        request.completedAt || request.updatedAt || request.createdAt
      );

      const month = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyMap[month]) {
        monthlyMap[month] = { earnings: 0, completedJobs: 0 };
      }

      monthlyMap[month].earnings += request.totalAmount || 0;
      monthlyMap[month].completedJobs += 1;
    });

    const monthlyEarnings = Object.entries(monthlyMap).map(
      ([month, data]) => ({
        month,
        earnings: data.earnings,
        amount: data.earnings,
        completedJobs: data.completedJobs,
      })
    );

    return res.status(200).json({
      success: true,
      monthlyEarnings,
    });
  } catch (error) {
    console.error("Monthly Earnings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly earnings",
    });
  }
};