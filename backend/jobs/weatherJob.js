const cron = require("node-cron");

const {
  monitorAllItineraries,
} = require("../services/weather/weatherMonitor");

/* ==========================================================
   Weather Monitor Job
========================================================== */

const startWeatherMonitorJob = () => {
  console.log("🌦 Weather Monitor Job Started");

  // Every day at 7:00 AM
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log("\n======================================");
      console.log("🌦 Running Daily Weather Monitor");
      console.log("Time:", new Date().toLocaleString());
      console.log("======================================");

      try {
        await monitorAllItineraries();

        console.log("✅ Weather monitoring completed.");
      } catch (error) {
        console.error("❌ Weather Monitor Failed");
        console.error(error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // Every day at 6:00 PM
  cron.schedule(
    "0 18 * * *",
    async () => {
      console.log("\n======================================");
      console.log("🌦 Running Evening Weather Monitor");
      console.log("Time:", new Date().toLocaleString());
      console.log("======================================");

      try {
        await monitorAllItineraries();

        console.log("✅ Evening weather monitoring completed.");
      } catch (error) {
        console.error("❌ Weather Monitor Failed");
        console.error(error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = {
  startWeatherMonitorJob,
};