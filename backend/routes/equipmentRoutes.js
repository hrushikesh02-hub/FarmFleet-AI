const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

const protectOwner =
  require("../middleware/ownerAuthMiddleware");

const {
  addEquipment,
  getOwnerEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
} = require(
  "../controllers/equipmentController"
);

/* ==========================
   ADD EQUIPMENT
========================== */

router.post(
  "/add",
  protectOwner,
  upload.single("image"),
  addEquipment
);

/* ==========================
   OWNER EQUIPMENT
========================== */

router.get(
  "/owner",
  protectOwner,
  getOwnerEquipment
);

/* ==========================
   ALL EQUIPMENT
========================== */

router.get(
  "/all",
  getAllEquipment
);

/* ==========================
   SINGLE EQUIPMENT
========================== */

router.get(
  "/:id",
  getEquipmentById
);

/* ==========================
   UPDATE EQUIPMENT
========================== */

router.put(
  "/:id",
  protectOwner,
  upload.single("image"),
  updateEquipment
);

/* ==========================
   DELETE EQUIPMENT
========================== */

router.delete(
  "/:id",
  protectOwner,
  deleteEquipment
);

module.exports = router;