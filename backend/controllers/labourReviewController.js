const LabourReview = require("../models/labourReview");
const LabourRequest = require("../models/labourRequest");
const Labour = require("../models/Labour");

/* ==========================
   CREATE LABOUR REVIEW
========================== */

exports.createReview = async (req, res) => {
  try {
    const {
      requestId,
      rating,
      comment,
    } = req.body;

    if (!requestId || !rating) {
      return res.status(400).json({
        success: false,
        message:
          "Request ID and rating are required",
      });
    }

    const request =
      await LabourRequest.findById(
        requestId
      );

    if (!request) {
      return res.status(404).json({
        success: false,
        message:
          "Labour request not found",
      });
    }

    if (
      request.farmer.toString() !==
      req.farmer._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized review submission",
      });
    }

    if (
      request.status !==
      "completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Review can only be submitted after job completion",
      });
    }

    if (request.reviewGiven) {
      return res.status(400).json({
        success: false,
        message:
          "Review already submitted for this request",
      });
    }

    const review =
      await LabourReview.create({
        request:
          request._id,

        labour:
          request.labour,

        farmer:
          request.farmer,

        booking:
          request.booking,

        equipment:
          request.equipment,

        rating,

        comment,
      });

    request.reviewGiven = true;
    request.reviewDate =
      new Date();

    await request.save();

    const labourReviews =
      await LabourReview.find({
        labour:
          request.labour,
      });

    const totalReviews =
      labourReviews.length;

    const averageRating =
      totalReviews > 0
        ? labourReviews.reduce(
            (sum, review) =>
              sum + review.rating,
            0
          ) / totalReviews
        : 0;

    await Labour.findByIdAndUpdate(
      request.labour,
      {
        rating: Number(
          averageRating.toFixed(1)
        ),

        totalReviews,
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Create Labour Review Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit review",
    });
  }
};

/* ==========================
   LABOUR REVIEWS DASHBOARD
========================== */

exports.getLabourReviews = async (
  req,
  res
) => {
  try {
    const labourId =
      req.labour._id;

    const reviews =
      await LabourReview.find({
        labour: labourId,
      })
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
        });

    const totalReviews =
      reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce(
                (sum, review) =>
                  sum + review.rating,
                0
              ) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const fiveStarReviews =
      reviews.filter(
        (review) =>
          review.rating === 5
      ).length;

    const farmerSatisfaction =
      totalReviews > 0
        ? Math.round(
            (reviews.filter(
              (review) =>
                review.rating >= 4
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
              (review) =>
                review.rating ===
                star
            ).length,
        })
      );

    const monthlyMap = {};

    reviews.forEach(
      (review) => {
        const month =
          new Date(
            review.createdAt
          ).toLocaleString(
            "en",
            {
              month: "short",
            }
          );

        if (!monthlyMap[month]) {
          monthlyMap[month] = {
            total: 0,
            count: 0,
          };
        }

        monthlyMap[month].total +=
          review.rating;

        monthlyMap[month].count +=
          1;
      }
    );

    const monthlyReviews =
      Object.entries(
        monthlyMap
      ).map(
        ([month, data]) => ({
          month,
          count: data.count,
          avg:
            Number(
              (
                data.total /
                data.count
              ).toFixed(1)
            ),
        })
      );

    const formattedReviews =
      reviews.map(
        (review) => ({
          id: review._id,

          farmer:
            review.farmer
              ?.fullName ||
            "Farmer",

          avatar:
            review.farmer
              ?.profileImage ||
            "",

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

          tag:
            review.rating >= 4
              ? "Excellent"
              : review.rating >= 3
              ? "Good"
              : "Needs Improvement",
        })
      );

    return res.status(200).json({
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
    console.error(
      "Get Labour Reviews Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch labour reviews",
    });
  }
};

/* ==========================
   GET PUBLIC LABOUR REVIEWS
========================== */

exports.getPublicReviews = async (
  req,
  res
) => {
  try {
    const reviews =
      await LabourReview.find()
        .populate(
          "farmer",
          "fullName profileImage"
        )
        .populate(
          "labour",
          "fullName profileImage primarySkill"
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

        farmer:
          review.farmer?.fullName ||
          "Farmer",

        farmerAvatar:
          review.farmer?.profileImage ||
          "",

        labour:
          review.labour?.fullName ||
          "Labour",

        labourAvatar:
          review.labour?.profileImage ||
          "",

        primarySkill:
          review.labour
            ?.primarySkill ||
          "",

        equipment:
          review.equipment?.name ||
          "Equipment",

        rating:
          review.rating,

        comment:
          review.comment,

        date: new Date(
          review.createdAt
        ).toLocaleDateString(),
      }));

    return res.status(200).json({
      success: true,
      reviews:
        formattedReviews,
    });
  } catch (error) {
    console.error(
      "Public Labour Reviews Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch public reviews",
    });
  }
};

/* ==========================
   GET SINGLE REVIEW
========================== */

exports.getLabourReviewById =
  async (req, res) => {
    try {
      const review =
        await LabourReview.findById(
          req.params.id
        )
          .populate(
            "farmer",
            "fullName profileImage village district"
          )
          .populate(
            "labour",
            "fullName profileImage primarySkill experience"
          )
          .populate(
            "equipment",
            "name image"
          );

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found",
        });
      }

      return res.status(200).json({
        success: true,
        review,
      });
    } catch (error) {
      console.error(
        "Get Labour Review Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch review",
      });
    }
  };

/* ==========================
   EXPORTS
========================== */

// module.exports = {
//   createReview,
//   getLabourReviews,
//   getPublicReviews,
//   getLabourReviewById,
// };