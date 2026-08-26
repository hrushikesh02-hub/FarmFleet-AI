const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Equipment = require("../models/Equipment");
const Labour = require("../models/Labour");
const geocodeLocation = require("../utils/geocodeLocation");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function backfillCoordinates() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/farmfleet";
    console.log("Connecting to MongoDB for backfill...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    // 1. Backfill Equipment
    const equipmentsToBackfill = await Equipment.find({
      $or: [
        { "coordinates.lat": 0, "coordinates.lng": 0 },
        { coordinates: { $exists: false } },
        { "coordinates.lat": { $exists: false } },
      ],
    });

    console.log(`Found ${equipmentsToBackfill.length} Equipment records to backfill.`);

    for (let i = 0; i < equipmentsToBackfill.length; i++) {
      const eq = equipmentsToBackfill[i];
      const locStr = eq.location;
      if (locStr) {
        console.log(`[${i + 1}/${equipmentsToBackfill.length}] Geocoding Equipment: "${eq.name}" at location "${locStr}"...`);
        const coords = await geocodeLocation(locStr);
        if (coords) {
          eq.coordinates = coords;
          await eq.save();
          console.log(`  -> Success: { lat: ${coords.lat}, lng: ${coords.lng} }`);
        } else {
          console.warn(`  -> Geocoding returned no result for "${locStr}". Keeping default {0,0}.`);
        }
      } else {
        console.warn(`  -> Equipment "${eq.name}" has no location string.`);
      }
      // Rate limiting: 1.1s delay between requests to respect Nominatim policy
      await delay(1100);
    }

    // 2. Backfill Labour
    const laboursToBackfill = await Labour.find({
      $or: [
        { "coordinates.lat": 0, "coordinates.lng": 0 },
        { coordinates: { $exists: false } },
        { "coordinates.lat": { $exists: false } },
      ],
    });

    console.log(`Found ${laboursToBackfill.length} Labour records to backfill.`);

    for (let i = 0; i < laboursToBackfill.length; i++) {
      const lab = laboursToBackfill[i];
      const locStr = lab.location || [lab.village, lab.district, lab.state].filter(Boolean).join(", ");
      if (locStr) {
        console.log(`[${i + 1}/${laboursToBackfill.length}] Geocoding Labour: "${lab.fullName}" at location "${locStr}"...`);
        const coords = await geocodeLocation(locStr);
        lab.location = locStr;
        if (coords) {
          lab.coordinates = coords;
          await lab.save();
          console.log(`  -> Success: { lat: ${coords.lat}, lng: ${coords.lng} }`);
        } else {
          await lab.save();
          console.warn(`  -> Geocoding returned no result for "${locStr}". Keeping default {0,0}.`);
        }
      } else {
        console.warn(`  -> Labour "${lab.fullName}" has no location info.`);
      }
      // Rate limiting: 1.1s delay between requests to respect Nominatim policy
      await delay(1100);
    }

    console.log("Backfill complete!");
  } catch (error) {
    console.error("Backfill failed with error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

backfillCoordinates();
