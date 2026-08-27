require("dotenv").config({ path: __dirname + "/../.env" });
const connectDB = require("../config/db");
const Equipment = require("../models/Equipment");

async function migrate() {
  await connectDB();
  const list = await Equipment.find({});
  console.log(`Found ${list.length} equipment items.`);
  for (const eq of list) {
    let updated = false;
    if (!eq.pricePerAcre || eq.pricePerAcre === 0) {
      eq.pricePerAcre = Math.round(eq.pricePerDay / 3) || 800;
      updated = true;
    }
    if (!eq.pricingType) {
      eq.pricingType = "both";
      updated = true;
    }
    if (updated) {
      await eq.save();
      console.log(`Updated ${eq.name}: pricePerAcre = ₹${eq.pricePerAcre}, pricingType = ${eq.pricingType}`);
    }
  }
  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
