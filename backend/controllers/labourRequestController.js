  const LabourRequest = require("../models/labourRequest");
  const Labour = require("../models/Labour");
  const Farmer = require("../models/Farmer");
  const Equipment = require("../models/Equipment");
  const Booking = require("../models/Booking");
  const { sendEmail } = require("../config/mail");

  /* ==========================
    HELPERS
  ========================== */

  // Statuses that count as "occupying" a labour's calendar for a given range.
  const CONFLICTING_STATUSES = ["pending", "accepted"];

  /**
   * Returns the first LabourRequest that overlaps the given date range for a
   * labour, considering only requests in a conflicting status. Pass
   * excludeRequestId when re-checking an existing request so it doesn't
   * conflict with itself.
   *
   * Overlap logic: existing.startDate <= requestedEnd && existing.endDate >= requestedStart
   */
  async function findConflictingRequest({
    labourId,
    startDate,
    endDate,
    excludeRequestId,
  }) {
    const query = {
      labour: labourId,
      status: { $in: CONFLICTING_STATUSES },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    };

    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    return LabourRequest.findOne(query);
  }

  /**
   * Validates labourId/startDate/endDate shared by createRequest and
   * checkAvailability. Returns { error } with an http status + message when
   * invalid, or { requestedStart, requestedEnd } when valid.
   */
  function parseAndValidateDateRange({ labourId, startDate, endDate }) {
    if (!labourId || !startDate || !endDate) {
      return {
        error: {
          status: 400,
          message: "labourId, startDate and endDate are required.",
        },
      };
    }

    const requestedStart = new Date(startDate);
    const requestedEnd = new Date(endDate);

    if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
      return {
        error: {
          status: 400,
          message: "startDate or endDate is not a valid date.",
        },
      };
    }

    if (requestedEnd < requestedStart) {
      return {
        error: {
          status: 400,
          message: "endDate cannot be before startDate.",
        },
      };
    }

    return { requestedStart, requestedEnd };
  }

  /* ==========================
    CREATE LABOUR REQUEST
  ========================== */

  exports.createRequest = async (req, res) => {
    try {
      const {
        labourId,
        bookingId,
        equipmentId,
        startDate,
        endDate,
        village,
        district,
      } = req.body;

      const { error, requestedStart, requestedEnd } =
        parseAndValidateDateRange({ labourId, startDate, endDate });

      if (error) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      const labour = await Labour.findById(labourId);

      if (!labour) {
        return res.status(404).json({
          success: false,
          message: "Labour not found.",
        });
      }

      const conflict = await findConflictingRequest({
        labourId,
        startDate: requestedStart,
        endDate: requestedEnd,
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Labour is already booked for these dates.",
        });
      }

      const days =
        Math.ceil(
          (requestedEnd - requestedStart) / (1000 * 60 * 60 * 24)
        ) + 1;

      const totalAmount = labour.dailyCharges * days;

      const request = await LabourRequest.create({
        farmer: req.farmer._id,

        labour: labourId,

        booking: bookingId || null,

        equipment: equipmentId || null,

        startDate: requestedStart,

        endDate: requestedEnd,

        village: village || req.farmer.village,

        district: district || req.farmer.district,

        dailyCharges: labour.dailyCharges,

        totalAmount,

        status: "pending",
      });

      const populatedRequest = await LabourRequest.findById(request._id)
        .populate(
          "labour",
          "fullName profileImage primarySkill dailyCharges"
        )
        .populate("farmer", "fullName mobile")
        .populate("equipment", "name");

      // Send email notification to Labour worker (non-blocking)
      try {
        if (labour?.email) {
          await sendEmail({
            to: labour.email,
            subject: "New Labour Request on FarmFleet",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color:#16a34a; margin-bottom: 8px;">🚜 FarmFleet — New Labour Request</h2>
                <p>Hello <strong>${labour.fullName}</strong>,</p>
                <p>You have received a new work request from <strong>${req.farmer.fullName}</strong>!</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Farmer Name:</td><td style="font-weight: bold;">${req.farmer.fullName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Location:</td><td style="font-weight: bold;">${request.village}, ${request.district}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Start Date:</td><td style="font-weight: bold;">${new Date(request.startDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">End Date:</td><td style="font-weight: bold;">${new Date(request.endDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Working Days:</td><td style="font-weight: bold;">${days} days</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Daily Rate:</td><td style="font-weight: bold;">₹${request.dailyCharges} / day</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="font-weight: bold; color: #16a34a;">₹${request.totalAmount}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="font-weight: bold; color: #d97706;">Pending Approval</td></tr>
                </table>
                <br />
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/labour/requests" style="background:#16a34a; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; font-weight: bold;">View Request</a>
                <p style="margin-top:24px; font-size:12px; color:#94a3b8;">Thank you for using FarmFleet 🌾</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("Create Labour Request Email Error:", emailError);
      }

      return res.status(201).json({
        success: true,
        message: "Labour request sent successfully.",
        request: populatedRequest,
      });
    } catch (error) {
      console.error("Create Labour Request Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create labour request.",
      });
    }
  };

  /* ==========================
    CHECK AVAILABILITY
  ========================== */

  exports.checkAvailability = async (req, res) => {
    try {
      const { labourId, startDate, endDate } = req.body;

      const { error, requestedStart, requestedEnd } =
        parseAndValidateDateRange({ labourId, startDate, endDate });

      if (error) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      const labour = await Labour.findById(labourId);

      if (!labour) {
        return res.status(404).json({
          success: false,
          message: "Labour not found.",
        });
      }

      const conflict = await findConflictingRequest({
        labourId,
        startDate: requestedStart,
        endDate: requestedEnd,
      });

      if (conflict) {
        return res.status(200).json({
          success: true,
          available: false,
          message: "Labour is already booked for these dates.",
        });
      }

      return res.status(200).json({
        success: true,
        available: true,
        message: "Labour is available.",
      });
    } catch (error) {
      console.error("Check Availability Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check availability.",
      });
    }
  };

  /* ==========================
    GET INCOMING REQUESTS
  ========================== */

  exports.getIncomingRequests = async (req, res) => {
    try {
      const requests = await LabourRequest.find({
        labour: req.labour._id,
      })
        .populate(
          "farmer",
          "fullName mobile village district profileImage"
        )
        .populate("equipment", "name image")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        total: requests.length,
        requests,
      });
    } catch (error) {
      console.error("Get Incoming Requests Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch requests.",
      });
    }
  };

  /* ==========================
    ACCEPT LABOUR REQUEST
  ========================== */

  exports.acceptRequest = async (req, res) => {
    try {
      const request = await LabourRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      if (request.labour.toString() !== req.labour._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access.",
        });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending requests can be accepted.",
        });
      }

      request.status = "accepted";
      request.acceptedAt = new Date();

      await request.save();

      const populatedRequest = await LabourRequest.findById(request._id)
        .populate("farmer", "fullName mobile profileImage email")
        .populate("labour", "fullName primarySkill email")
        .populate("equipment", "name image");

      // Send email to Farmer (non-blocking)
      try {
        const farmer = await Farmer.findById(request.farmer);
        const labour = await Labour.findById(request.labour);

        if (farmer?.email) {
          await sendEmail({
            to: farmer.email,
            subject: "Your Labour Request Has Been Accepted",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color:#16a34a; margin-bottom: 8px;">🎉 Labour Request Accepted!</h2>
                <p>Hello <strong>${farmer.fullName}</strong>,</p>
                <p>Great news! <strong>${labour.fullName}</strong> has accepted your labour request.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Labour Name:</td><td style="font-weight: bold;">${labour.fullName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Work Location:</td><td style="font-weight: bold;">${request.village}, ${request.district}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Start Date:</td><td style="font-weight: bold;">${new Date(request.startDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">End Date:</td><td style="font-weight: bold;">${new Date(request.endDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Daily Charges:</td><td style="font-weight: bold;">₹${request.dailyCharges} / day</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="font-weight: bold; color: #16a34a;">₹${request.totalAmount}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Request ID:</td><td style="font-weight: bold;">${request._id}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="font-weight: bold; color: #16a34a;">Accepted</td></tr>
                </table>
                <br />
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/renter/bookings" style="background:#16a34a; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; font-weight: bold;">View Booking</a>
                <p style="margin-top:24px; font-size:12px; color:#94a3b8;">Thank you for using FarmFleet 🌾</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Accept Labour Request Email Error:", emailErr);
      }

      return res.status(200).json({
        success: true,
        message: "Request accepted successfully.",
        request: populatedRequest,
      });
    } catch (error) {
      console.error("Accept Labour Request Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to accept request.",
      });
    }
  };

  /* ==========================
    REJECT LABOUR REQUEST
  ========================== */

  exports.rejectRequest = async (req, res) => {
    try {
      const { reason } = req.body;

      const request = await LabourRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      if (request.labour.toString() !== req.labour._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access.",
        });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending requests can be rejected.",
        });
      }

      request.status = "rejected";
      request.rejectedAt = new Date();

      if (reason) {
        request.rejectionReason = reason;
      }

      await request.save();

      return res.status(200).json({
        success: true,
        message: "Request rejected successfully.",
        request,
      });
    } catch (error) {
      console.error("Reject Labour Request Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject request.",
      });
    }
  };

  /* ==========================
    COMPLETE LABOUR JOB
  ========================== */

  exports.completeRequest = async (req, res) => {
    try {
      const request = await LabourRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      if (request.labour.toString() !== req.labour._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access.",
        });
      }

      if (request.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "Only accepted jobs can be completed.",
        });
      }

      request.status = "completed";
      request.completedAt = new Date();

      await request.save();

      await Labour.findByIdAndUpdate(req.labour._id, {
        $inc: {
          completedJobs: 1,
        },
      });

      // Send email to Farmer (non-blocking)
      try {
        const farmer = await Farmer.findById(request.farmer);
        const labour = await Labour.findById(request.labour);

        if (farmer?.email) {
          await sendEmail({
            to: farmer.email,
            subject: "Your Labour Work Has Been Completed",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color:#16a34a; margin-bottom: 8px;">✅ Work Completed!</h2>
                <p>Hello <strong>${farmer.fullName}</strong>,</p>
                <p><strong>${labour.fullName}</strong> has marked your requested work as completed.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Labour Name:</td><td style="font-weight: bold;">${labour.fullName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Location:</td><td style="font-weight: bold;">${request.village}, ${request.district}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Start Date:</td><td style="font-weight: bold;">${new Date(request.startDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">End Date:</td><td style="font-weight: bold;">${new Date(request.endDate).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Completion Date:</td><td style="font-weight: bold;">${new Date(request.completedAt).toLocaleDateString("en-IN")}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Total Amount:</td><td style="font-weight: bold; color: #16a34a;">₹${request.totalAmount}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Request ID:</td><td style="font-weight: bold;">${request._id}</td></tr>
                </table>
                <br />
                <p>Please log in to leave a review and share your feedback on the work!</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/renter/bookings" style="background:#16a34a; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; font-weight: bold;">Leave a Review</a>
                <p style="margin-top:24px; font-size:12px; color:#94a3b8;">Thank you for using FarmFleet 🌾</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Complete Labour Job Email Error:", emailErr);
      }

      return res.status(200).json({
        success: true,
        message: "Job marked as completed.",
        request,
      });
    } catch (error) {
      console.error("Complete Labour Job Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to complete job.",
      });
    }
  };

  /* ==========================
    GET REQUEST DETAILS
  ========================== */

  exports.getRequestById = async (req, res) => {
    try {
      const request = await LabourRequest.findById(req.params.id)
        .populate(
          "farmer",
          "fullName mobile village district profileImage"
        )
        .populate(
          "labour",
          "fullName profileImage primarySkill experience dailyCharges"
        )
        .populate("equipment", "name image category")
        .populate("booking");

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      if (request.labour._id.toString() !== req.labour._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access.",
        });
      }

      return res.status(200).json({
        success: true,
        request,
      });
    } catch (error) {
      console.error("Get Request Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch request.",
      });
    }
  };

  /* ==========================
    REQUEST HISTORY
  ========================== */

  exports.getRequestHistory = async (req, res) => {
    try {
      const requests = await LabourRequest.find({
        labour: req.labour._id,

        status: {
          $in: ["completed", "rejected"],
        },
      })
        .populate("farmer", "fullName profileImage")
        .populate("equipment", "name image")
        .sort({
          updatedAt: -1,
        });

      return res.status(200).json({
        success: true,
        total: requests.length,
        requests,
      });
    } catch (error) {
      console.error("Request History Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch request history.",
      });
    }
  };

  /* ==========================
    GET FARMER LABOUR REQUESTS
  ========================== */

  exports.getFarmerRequests = async (req, res) => {
    try {
      const requests = await LabourRequest.find({
        farmer: req.farmer._id,
      })
        .populate(
          "labour",
          "fullName mobile email village district profileImage primarySkill experience dailyCharges rating totalReviews"
        )
        .populate("equipment", "name image pricePerDay")
        .populate("booking")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        total: requests.length,
        requests,
      });
    } catch (error) {
      console.error("Get Farmer Labour Requests Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch farmer labour requests.",
      });
    }
  };
