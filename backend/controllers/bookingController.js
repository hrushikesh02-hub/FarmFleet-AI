const Booking = require("../models/Booking");
const Equipment = require("../models/Equipment");
const Owner = require("../models/Owner");
const Farmer = require("../models/Farmer");
const { sendEmail } = require("../config/mail");
const { buildBookingEmailTemplate } = require("../templates/emailTemplate");

/* ==========================
   CREATE BOOKING
========================== */

const createBooking = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
      farmAddress,
      acres,
    } = req.body;

    if (process.env.NODE_ENV !== "production") {
      console.log("[createBooking] Received payload →", JSON.stringify({
        farmAddress,
        acres,
      }));
    }

    if (
      !equipmentId ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Equipment ID and start date are required",
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

    let totalAmount = 0;
    const numAcres = Number(acres) > 0 ? Number(acres) : 1;
    
    const acreRate = equipment.pricePerAcre > 0 ? equipment.pricePerAcre : 800;
    totalAmount = Math.round(numAcres * acreRate);

    const booking =
      await Booking.create({
        renter: req.farmer._id,
        owner: equipment.owner,
        equipment:
          equipment._id,
        startDate,
        endDate: startDate,
        totalAmount,
        status: "pending",
        farmAddress: farmAddress || {},
        acres: numAcres,
      });

    try {
      const owner =
        await Owner.findById(
          equipment.owner
        );

      if (owner?.email) {
        const emailDetails = [
          { label: "Equipment Name", value: equipment.name },
          { label: "Equipment Location", value: equipment.location },
          { label: "Farm Address", value: farmAddress?.address || "—" },
          { label: "Farm Village", value: farmAddress?.village || "—" },
          { label: "Farm District", value: farmAddress?.district || "—" },
          { label: "Farm State", value: farmAddress?.state || "—" },
          { label: "Rental Type", value: "Acre-based Rental" },
          { label: "Area (Acres)", value: `${numAcres} Acre${numAcres > 1 ? "s" : ""}` },
          { label: "Rate per Acre", value: `₹${equipment.pricePerAcre || 800} / acre` },
          { label: "Scheduled Work Date", value: new Date(startDate).toLocaleDateString("en-IN") },
          { label: "Total Amount", value: `₹${totalAmount.toLocaleString("en-IN")}`, highlight: true },
          { label: "Booking Status", value: "Pending Response", isStatus: true },
        ];

        await sendEmail({
          to: owner.email,
          subject: "New Booking Request — FarmFleet AI",
          html: buildBookingEmailTemplate({
            role: "Equipment Owner",
            headline: "New Equipment Booking Request",
            recipientName: owner.fullName,
            message: `Farmer <strong>${req.farmer.fullName || 'A farmer'}</strong> has submitted a booking request for your equipment.`,
            details: emailDetails,
            cta: {
              text: "Review & Respond to Booking",
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/owner/login`,
            },
            footerNote: "Please log in to your owner dashboard to accept or reject this request.",
          }),
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
            "name image location pricePerAcre pricePerDay pricePerHour pricingType"
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
            "name image location pricePerAcre pricePerDay pricePerHour pricingType"
          )
          .populate(
            "renter",
            "fullName mobile email village district state"
          )
          .select("+farmAddress")
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
          subject: "Booking Accepted — FarmFleet AI",
          html: buildBookingEmailTemplate({
            role: "Renter (Farmer)",
            headline: "Booking Request Accepted! 🎉",
            recipientName: farmer.fullName,
            message: "Great news! Your booking request has been accepted by the equipment owner.",
            details: [
              { label: "Booking ID", value: booking._id },
              { label: "Booking Status", value: "Accepted / Confirmed", highlight: true },
            ],
            cta: {
              text: "View Booking Details",
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/renter/bookings`,
            },
          }),
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
          subject: "Booking Request Update — FarmFleet AI",
          html: buildBookingEmailTemplate({
            role: "Renter (Farmer)",
            headline: "Booking Request Update",
            recipientName: farmer.fullName,
            message: "Unfortunately, the equipment owner is unable to fulfill your booking request at this time.",
            details: [
              { label: "Booking ID", value: booking._id },
              { label: "Booking Status", value: "Declined", isStatus: true },
            ],
            cta: {
              text: "Browse Other Equipment",
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/renter/dashboard`,
            },
            footerNote: "You can search for alternative available equipment in your area.",
          }),
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
          subject: "Booking Completed — FarmFleet AI",
          html: buildBookingEmailTemplate({
            role: "Renter (Farmer)",
            headline: "Equipment Booking Completed",
            recipientName: farmer.fullName,
            message: "The equipment owner has marked your booking as completed. We hope the service met your expectations!",
            details: [
              { label: "Booking ID", value: booking._id },
              { label: "Booking Status", value: "Completed", highlight: true },
            ],
            cta: {
              text: "Leave Review & Rating",
              url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/renter/bookings`,
            },
            footerNote: "Your feedback helps fellow farmers make better rental choices.",
          }),
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