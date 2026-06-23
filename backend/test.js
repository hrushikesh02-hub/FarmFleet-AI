require("dotenv").config();
const mongoose = require("mongoose");

console.log("URI loaded:", process.env.MONGO_URI ? "YES" : "NO");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ CONNECTED");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ FULL ERROR:");
    console.dir(err, { depth: null });
    process.exit(1);
  });