const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Owner = require("../models/Owner");

/* ==========================
   CREATE REVIEW
========================== */

exports.createReview = async (
  req,
  res
) => {
  try {
    const {
      bookingId,
      rating,
      comment,
    } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID and rating are required",
      });
    }

    const booking =
      await Booking.findById(
        bookingId
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found",
      });
    }

    if (
      booking.renter.toString() !==
      req.farmer._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized review submission",
      });
    }

    if (
      booking.status !==
      "completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Review can only be submitted after booking completion",
      });
    }

    if (
      booking.reviewGiven
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Review already submitted for this booking",
      });
    }

    const review =
      await Review.create({
        booking:
          booking._id,
        equipment:
          booking.equipment,
        owner:
          booking.owner,
        farmer:
          booking.renter,
        rating,
        comment,
      });

    booking.reviewGiven = true;
    booking.reviewDate =
      new Date();

    await booking.save();

    const ownerReviews =
      await Review.find({
        owner:
          booking.owner,
      });

    const totalReviews =
      ownerReviews.length;

    const averageRating =
      totalReviews > 0
        ? ownerReviews.reduce(
          (sum, review) =>
            sum +
            review.rating,
          0
        ) / totalReviews
        : 0;

    await Owner.findByIdAndUpdate(
      booking.owner,
      {
        rating:
          Number(
            averageRating.toFixed(
              1
            )
          ),
        totalReviews,
      }
    );

    res.status(201).json({
      success: true,
      message:
        "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Create Review Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to submit review",
    });
  }
};

/* ==========================
   OWNER REVIEWS DASHBOARD
========================== */

exports.getOwnerReviews = async (
  req,
  res
) => {
  try {
    const ownerId =
      req.owner._id;

    const reviews =
      await Review.find({
        owner: ownerId,
      })
        .populate(
          "farmer",
          "fullName"
        )
        .populate(
          "equipment",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    const totalReviews =
      reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
          (
            reviews.reduce(
              (sum, r) =>
                sum + r.rating,
              0
            ) / totalReviews
          ).toFixed(1)
        )
        : 0;

    const fiveStarReviews =
      reviews.filter(
        (r) =>
          r.rating === 5
      ).length;

    const farmerSatisfaction =
      totalReviews > 0
        ? Math.round(
          (reviews.filter(
            (r) =>
              r.rating >= 4
          ).length /
            totalReviews) *
          100
        )
        : 0;

    const ratingDistribution =
      [5, 4, 3, 2, 1].map(
        (star) => ({
          stars: star,
          count:
            reviews.filter(
              (r) =>
                r.rating ===
                star
            ).length,
        })
      );

    const monthlyMap =
      {};

    reviews.forEach(
      (review) => {
        const month =
          new Date(
            review.createdAt
          ).toLocaleString(
            "en",
            {
              month:
                "short",
            }
          );

        if (
          !monthlyMap[
          month
          ]
        ) {
          monthlyMap[
            month
          ] = {
            total: 0,
            count: 0,
          };
        }

        monthlyMap[
          month
        ].total +=
          review.rating;

        monthlyMap[
          month
        ].count += 1;
      }
    );

    const monthlyReviews =
      Object.entries(
        monthlyMap
      ).map(
        ([month, data]) => ({
          month,
          count:
            data.count,
          avg:
            data.total /
            data.count,
        })
      );

    const formattedReviews =
      reviews.map(
        (review) => ({
          id: review._id,

          name:
            review.farmer
              ?.fullName ||
            "Farmer",

          equipment:
            review
              .equipment
              ?.name ||
            "Equipment",

          rating:
            review.rating,

          comment:
            review.comment,

          date:
            new Date(
              review.createdAt
            ).toLocaleDateString(),

          verified: true,

          tag: "Service",
        })
      );

    res.status(200).json({
      success: true,

      averageRating,

      totalReviews,

      fiveStarReviews,

      farmerSatisfaction,

      ratingDistribution,

      monthlyReviews,

      reviews:
        formattedReviews,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};

/* ==========================
   GET EQUIPMENT REVIEWS
========================== */

exports.getEquipmentReviews =
  async (req, res) => {
    try {
      const reviews =
        await Review.find({
          equipment:
            req.params.id,
        })
          .populate(
            "farmer",
            "fullName"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch reviews",
      });
    }
  };

/* ==========================
   PUBLIC REVIEWS
========================== */

exports.getPublicReviews =
  async (req, res) => {
    try {
      const reviews = await Review.find()
        .populate(
          "farmer",
          "fullName profileImage"
        )
        .populate(
          "equipment",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .limit(20);

      const formattedReviews =
        reviews.map((review) => ({
          id: review._id,
          name:
            review.farmer?.fullName ||
            "Farmer",
          avatar:
            review.farmer?.profileImage || "",
          equipment:
            review.equipment?.name ||
            "Equipment",
          rating: review.rating,
          text: review.comment,
          date: new Date(
            review.createdAt
          ).toLocaleDateString(),
        }));

      res.status(200).json({
        success: true,
        reviews: formattedReviews,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch reviews",
      });
    }
  };