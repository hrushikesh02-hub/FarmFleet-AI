const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");
const Owner = require("../models/Owner");
const Farmer = require("../models/Farmer");
const { sendEmail } = require("../config/mail");

/* ==========================
   CREATE BOOKING
========================== */

const createBooking = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
    } = req.body;

    if (
      !equipmentId ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Equipment ID, start date and end date are required",
      });
    }

    const equipment =
      await Equipment.findById(
        equipmentId
      );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found",
      });
    }

    const start = new Date(
      startDate
    );

    const end = new Date(
      endDate
    );

    const totalDays = Math.max(
      1,
      Math.ceil(
        (end - start) /
          (1000 * 60 * 60 * 24)
      )
    );

    const totalAmount =
      totalDays *
      equipment.pricePerDay;

    const booking =
      await Booking.create({
        renter: req.farmer._id,
        owner: equipment.owner,
        equipment:
          equipment._id,
        startDate,
        endDate,
        totalAmount,
        status: "pending",
      });

    try {
      const owner =
        await Owner.findById(
          equipment.owner
        );

      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject:
            "New Booking Request - FarmFleet",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color:#16a34a;">
                New Booking Request
              </h2>

              <p>
                Hello ${owner.fullName},
              </p>

              <p>
                A farmer has submitted a booking request for your equipment.
              </p>

              <hr />

              <p>
                <strong>Equipment:</strong>
                ${equipment.name}
              </p>

              <p>
                <strong>Location:</strong>
                ${equipment.location}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${new Date(
                  startDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${new Date(
                  endDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Total Amount:</strong>
                ₹${totalAmount}
              </p>

              <br />

              <a
                href="${process.env.FRONTEND_URL}/owner/login"
                style="
                  background:#16a34a;
                  color:white;
                  padding:12px 20px;
                  text-decoration:none;
                  border-radius:8px;
                  display:inline-block;
                "
              >
                Login To FarmFleet
              </a>

              <p style="margin-top:20px;">
                Please review and respond to this booking request.
              </p>

              <p>
                Team FarmFleet 🚜
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "Booking email failed:",
        emailError
      );
    }

    res.status(201).json({
      success: true,
      message:
        "Booking request created successfully",
      booking,
    });
  } catch (error) {
    console.error(
      "Create Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create booking",
    });
  }
};

/* ==========================
   GET FARMER BOOKINGS
========================== */

const getFarmerBookings =
  async (req, res) => {
    try {
      const bookings =
        await Booking.find({
          renter:
            req.farmer._id,
        })
          .populate(
            "equipment",
            "name image location pricePerHour pricePerDay"
          )
          .populate(
            "owner",
            "fullName mobile email village district state"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "Get Farmer Bookings Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch bookings",
      });
    }
  };

/* ==========================
   GET OWNER BOOKINGS
========================== */

const getOwnerBookings =
  async (req, res) => {
    try {
      const bookings =
        await Booking.find({
          owner:
            req.owner._id,
        })
          .populate(
            "equipment",
            "name image location pricePerHour pricePerDay"
          )
          .populate(
            "renter",
            "fullName mobile email village district state"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "Get Owner Bookings Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch bookings",
      });
    }
  };

/* ==========================
   ACCEPT BOOKING
========================== */

const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.owner.toString() !==
      req.owner._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    booking.status = "accepted";

    await booking.save();

    try {
      const farmer =
        await Farmer.findById(
          booking.renter
        );

      if (farmer?.email) {
        await sendEmail({
          to: farmer.email,
          subject:
            "Booking Accepted - FarmFleet",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color:#16a34a;">
                Booking Accepted
              </h2>

              <p>
                Hello ${farmer.fullName},
              </p>

              <p>
                Great news! Your booking request has been accepted by the equipment owner.
              </p>

              <p>
                <strong>Booking ID:</strong>
                ${booking._id}
              </p>

              <p>
                The owner has approved your request and the booking is now confirmed.
              </p>

              <a
                href="${process.env.FRONTEND_URL}/renter/bookings"
                style="
                  background:#16a34a;
                  color:white;
                  padding:12px 20px;
                  text-decoration:none;
                  border-radius:8px;
                  display:inline-block;
                "
              >
                View Booking
              </a>

              <p style="margin-top:20px;">
                Thank you for using FarmFleet 🚜
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "Accept booking email failed:",
        emailError
      );
    }

    res.status(200).json({
      success: true,
      message: "Booking accepted",
      booking,
    });
  } catch (error) {
    console.error(
      "Accept Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to accept booking",
    });
  }
};

/* ==========================
   REJECT BOOKING
========================== */

const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.owner.toString() !==
      req.owner._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    booking.status = "rejected";

    await booking.save();

    try {
      const farmer =
        await Farmer.findById(
          booking.renter
        );

      if (farmer?.email) {
        await sendEmail({
          to: farmer.email,
          subject:
            "Booking Rejected - FarmFleet",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color:#dc2626;">
                Booking Rejected
              </h2>

              <p>
                Hello ${farmer.fullName},
              </p>

              <p>
                Unfortunately, the equipment owner has rejected your booking request.
              </p>

              <p>
                <strong>Booking ID:</strong>
                ${booking._id}
              </p>

              <p>
                You can browse other available equipment and submit a new booking request.
              </p>

              <a
                href="${process.env.FRONTEND_URL}"
                style="
                  background:#16a34a;
                  color:white;
                  padding:12px 20px;
                  text-decoration:none;
                  border-radius:8px;
                  display:inline-block;
                "
              >
                Browse Equipment
              </a>

              <p style="margin-top:20px;">
                Thank you for using FarmFleet 🚜
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "Reject booking email failed:",
        emailError
      );
    }

    res.status(200).json({
      success: true,
      message: "Booking rejected",
      booking,
    });
  } catch (error) {
    console.error(
      "Reject Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to reject booking",
    });
  }
};

/* ==========================
   COMPLETE BOOKING
========================== */

const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.owner.toString() !==
      req.owner._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    booking.status = "completed";

    await booking.save();

    try {
      const farmer =
        await Farmer.findById(
          booking.renter
        );

      if (farmer?.email) {
        await sendEmail({
          to: farmer.email,
          subject:
            "Booking Completed - FarmFleet",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              
              <h2 style="color:#16a34a;">
                Booking Completed
              </h2>

              <p>
                Hello ${farmer.fullName},
              </p>

              <p>
                The equipment owner has marked your booking as completed.
              </p>

              <p>
                <strong>Booking ID:</strong>
                ${booking._id}
              </p>

              <p>
                We hope the equipment and service met your expectations.
              </p>

              <p>
                Please login to FarmFleet and leave a review and rating for your experience.
              </p>

              <a
                href="${process.env.FRONTEND_URL}/renter/bookings"
                style="
                  background:#16a34a;
                  color:white;
                  padding:12px 20px;
                  text-decoration:none;
                  border-radius:8px;
                  display:inline-block;
                "
              >
                Leave Review
              </a>

              <p style="margin-top:20px;">
                Your feedback helps other farmers make better decisions.
              </p>

              <p>
                Thank you for using FarmFleet 🚜
              </p>

            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "Complete booking email failed:",
        emailError
      );
    }

    res.status(200).json({
      success: true,
      message: "Booking completed",
      booking,
    });
  } catch (error) {
    console.error(
      "Complete Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to complete booking",
    });
  }
};

  /* ==========================
   CHECK AVAILABILITY
========================== */

const checkAvailability = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
    } = req.body;

    if (
      !equipmentId ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Equipment ID, start date and end date are required",
      });
    }

    const conflictingBooking =
      await Booking.findOne({
        equipment: equipmentId,

        status: {
          $in: [
            "pending",
            "accepted",
          ],
        },

        startDate: {
          $lte: new Date(endDate),
        },

        endDate: {
          $gte: new Date(startDate),
        },
      });

    if (conflictingBooking) {
      return res.status(200).json({
        success: true,
        available: false,
        message:
          "Equipment is already booked for selected dates",
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message:
        "Equipment is available",
    });
  } catch (error) {
    console.error(
      "Availability Check Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check availability",
    });
  }
};

module.exports = {
  checkAvailability,
  createBooking,
  getFarmerBookings,
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
};