const Equipment = require("../models/Equipment");
const cloudinary = require("../config/cloudinary");
const geocodeLocation =
require("../utils/geocodeLocation");
/* ==========================
   ADD EQUIPMENT
========================== */

const addEquipment = async (req, res) => {
  try {
    const {
      name,
      type,
      pricePerAcre,
      pricePerDay,
      pricePerHour,
      pricingType,
      location,
      operatorIncluded,
    } = req.body;

    let imageUrl = "";

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const uploadedImage =
        await cloudinary.uploader.upload(
          base64,
          {
            folder: "farmfleet/equipment",
          }
        );

      imageUrl =
        uploadedImage.secure_url;
    }

    let coordinates = { lat: 0, lng: 0 };
    if (location) {
      const geoResult = await geocodeLocation(location);
      if (geoResult) {
        coordinates = geoResult;
      }
    }

    const equipment =
      await Equipment.create({
        owner: req.owner._id,
        name,
        type,
        pricePerAcre: Number(pricePerAcre) || 0,
        pricePerDay: Number(pricePerDay) || 0,
        pricePerHour: Number(pricePerHour) || 0,
        pricingType: pricingType || "both",
        location,
        coordinates,
        operatorIncluded,
        image: imageUrl,
      });

    res.status(201).json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error(
      "Add Equipment Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to add equipment",
    });
  }
};

/* ==========================
   GET OWNER EQUIPMENT
========================== */

const getOwnerEquipment =
  async (req, res) => {
    try {
      const equipments =
        await Equipment.find({
          owner: req.owner._id,
        });

      res.status(200).json({
        success: true,
        equipments,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
      });
    }
  };

/* ==========================
   GET ALL EQUIPMENT
========================== */

const getAllEquipment =
  async (req, res) => {
    try {
      const equipments =
        await Equipment.find()
          .populate(
            "owner",
            "fullName village district state"
          );

      res.status(200).json({
        success: true,
        equipments,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
      });
    }
  };

  /* ==========================
   UPDATE EQUIPMENT
========================== */

const updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      _id: req.params.id,
      owner: req.owner._id,
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    equipment.name =
      req.body.name || equipment.name;

    equipment.type =
      req.body.type || equipment.type;

    if (req.body.pricePerAcre !== undefined) {
      equipment.pricePerAcre = Number(req.body.pricePerAcre) || 0;
    }

    if (req.body.pricePerDay !== undefined) {
      equipment.pricePerDay = Number(req.body.pricePerDay) || 0;
    }

    if (req.body.pricePerHour !== undefined) {
      equipment.pricePerHour = Number(req.body.pricePerHour) || 0;
    }

    if (req.body.pricingType !== undefined) {
      equipment.pricingType = req.body.pricingType;
    }

    if (req.body.location) {
      equipment.location = req.body.location;
      const geoResult = await geocodeLocation(req.body.location);
      if (geoResult) {
        equipment.coordinates = geoResult;
      }
    }

    equipment.operatorIncluded =
      req.body.operatorIncluded ??
      equipment.operatorIncluded;

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64"
      )}`;

      const uploadedImage =
        await cloudinary.uploader.upload(
          base64,
          {
            folder: "farmfleet/equipment",
          }
        );

      equipment.image =
        uploadedImage.secure_url;
    }

    await equipment.save();

    res.status(200).json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error(
      "Update Equipment Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update equipment",
    });
  }
};

/* ==========================
   DELETE EQUIPMENT
========================== */

const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      _id: req.params.id,
      owner: req.owner._id,
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    await Equipment.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Equipment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Equipment Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete equipment",
    });
  }
};


/* ==========================
   GET SINGLE EQUIPMENT
========================== */

const getEquipmentById = async (
  req,
  res
) => {
  try {
    const equipment =
      await Equipment.findById(
        req.params.id
      ).populate(
        "owner",
        "fullName mobile village district state profileImage rating totalReviews"
      );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found",
      });
    }

    res.status(200).json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error(
      "Get Equipment By Id Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch equipment",
    });
  }
};
module.exports = {
  addEquipment,
  getOwnerEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
};