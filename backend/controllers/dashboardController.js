const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");

exports.getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const bookings = await Booking.find({
      owner: ownerId,
    }).populate("equipment");

    const equipments = await Equipment.find({
      owner: ownerId,
    });

    /* ==========================
       BOOKINGS
    ========================== */

    const completedBookings = bookings.filter(
      (b) => b.status === "completed"
    );

    const totalEarnings =
      completedBookings.reduce(
        (sum, booking) =>
          sum + (booking.totalAmount || 0),
        0
      );

    const equipmentCount = equipments.length;

    const activeRentals = bookings.filter(
      (b) => b.status === "accepted"
    ).length;

    const upcomingJobs = bookings.filter(
      (b) =>
        b.startDate &&
        new Date(b.startDate) > new Date()
    ).length;

    /* ==========================
       MONTHLY EARNINGS
    ========================== */

    const currentYear =
      new Date().getFullYear();

    const monthlyEarnings = [];

    for (let i = 0; i < 12; i++) {
      const monthBookings =
        completedBookings.filter(
          (booking) => {
            const date = new Date(
              booking.createdAt
            );

            return (
              date.getMonth() === i &&
              date.getFullYear() ===
                currentYear
            );
          }
        );

      monthlyEarnings.push({
        month: new Date(
          currentYear,
          i,
          1
        ).toLocaleString("en", {
          month: "short",
        }),

        earnings:
          monthBookings.reduce(
            (sum, booking) =>
              sum +
              (booking.totalAmount || 0),
            0
          ),
      });
    }

    /* ==========================
       EQUIPMENT USAGE
    ========================== */

    const equipmentUsage =
      equipments.map((equipment) => {
        const usageCount =
          bookings.filter(
            (booking) =>
              booking.equipment &&
              booking.equipment._id.toString() ===
                equipment._id.toString()
          ).length;

        return {
          name: equipment.name,
          bookings: usageCount,
          hours: usageCount * 10,
        };
      });

    /* ==========================
       TOP PERFORMING EQUIPMENT
    ========================== */

    let topEquipment = null;

    if (equipmentUsage.length > 0) {
      const sortedEquipment =
        [...equipmentUsage].sort(
          (a, b) =>
            b.bookings - a.bookings
        );

      const bestEquipment =
        sortedEquipment[0];

      const equipmentDetails =
        equipments.find(
          (e) =>
            e.name ===
            bestEquipment.name
        );

      let revenue = 0;

      completedBookings.forEach(
        (booking) => {
          if (
            booking.equipment &&
            booking.equipment.name ===
              bestEquipment.name
          ) {
            revenue +=
              booking.totalAmount || 0;
          }
        }
      );

      topEquipment = {
        name: bestEquipment.name,

        type:
          equipmentDetails?.type ||
          "Equipment",

        bookings:
          bestEquipment.bookings,

        revenue,

        utilization:
          bookings.length > 0
            ? Math.round(
                (bestEquipment.bookings /
                  bookings.length) *
                  100
              )
            : 0,
      };
    }

    /* ==========================
       RECENT ACTIVITY
    ========================== */

    const activities = bookings
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 5)
      .map((booking, index) => ({
        id: index + 1,

        text: `${booking.status.toUpperCase()} - ${
          booking.equipment?.name ||
          "Equipment"
        }`,

        time: new Date(
          booking.createdAt
        ).toLocaleDateString(),
      }));

    /* ==========================
       UTILIZATION
    ========================== */

    const utilization =
      equipmentCount > 0
        ? Math.round(
            (activeRentals /
              equipmentCount) *
              100
          )
        : 0;

    /* ==========================
       RESPONSE
    ========================== */

    res.status(200).json({
      success: true,

      ownerName:
        req.owner.name ||
        req.owner.fullName ||
        "Owner",

      totalEarnings,

      equipmentCount,

      activeRentals,

      upcomingJobs,

      utilization,

      trustRating: 4.8,

      maintenanceDue: 2,

      topEquipment,

      monthlyEarnings,

      equipmentUsage,

      activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};