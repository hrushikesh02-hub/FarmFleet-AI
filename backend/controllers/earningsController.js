const Booking = require("../models/Booking");

exports.getOwnerEarnings = async (req, res) => {
  try {
    console.log("OWNER =>", req.owner);

    if (!req.owner || !req.owner._id) {
      return res.status(401).json({
        success: false,
        message: "Owner not authenticated",
      });
    }

    const ownerId = req.owner._id;

    const bookings = await Booking.find({
      owner: ownerId,
    }).populate("equipment");

    const completedBookings = bookings.filter(
      (b) => b.status === "completed"
    );

    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0
    );

    const totalBookings = bookings.length;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const lastMonthYear =
      currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    completedBookings.forEach((booking) => {
      const d = new Date(booking.createdAt);

      if (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        thisMonthRevenue += booking.totalAmount || 0;
      }

      if (
        d.getMonth() === lastMonth &&
        d.getFullYear() === lastMonthYear
      ) {
        lastMonthRevenue += booking.totalAmount || 0;
      }
    });

    const avgBooking =
      completedBookings.length > 0
        ? Math.round(
            totalRevenue / completedBookings.length
          )
        : 0;

    // Monthly Earnings
    const monthlyEarnings = [];

    for (let i = 0; i < 12; i++) {
      const monthName = new Date(
        currentYear,
        i,
        1
      ).toLocaleString("en", {
        month: "short",
      });

      const monthBookings = completedBookings.filter(
        (booking) => {
          const d = new Date(booking.createdAt);

          return (
            d.getMonth() === i &&
            d.getFullYear() === currentYear
          );
        }
      );

      monthlyEarnings.push({
        month: monthName,
        earnings: monthBookings.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        ),
        bookings: monthBookings.length,
      });
    }

    // Equipment Revenue
    const equipmentMap = {};

    completedBookings.forEach((booking) => {
      const equipmentName =
        booking.equipment?.name || "Unknown Equipment";

      equipmentMap[equipmentName] =
        (equipmentMap[equipmentName] || 0) +
        (booking.totalAmount || 0);
    });

    const equipmentRevenue = Object.entries(
      equipmentMap
    ).map(([name, revenue]) => ({
      name,
      revenue,
    }));

    // Utilization
    const acceptedOrCompleted = bookings.filter(
      (b) =>
        b.status === "accepted" ||
        b.status === "completed"
    ).length;

    const utilization =
      totalBookings > 0
        ? Math.round(
            (acceptedOrCompleted / totalBookings) * 100
          )
        : 0;

    return res.status(200).json({
      success: true,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      avgBooking,
      utilization,
      totalBookings,
      monthlyEarnings,
      equipmentRevenue,
    });
  } catch (error) {
    console.error("Earnings Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};