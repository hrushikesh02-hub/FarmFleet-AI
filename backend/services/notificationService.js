const { sendEmail } = require("../config/mail");
const {
  buildOfficialEmailBody,
  buildDetailsTable,
  buildWelcomeEmailTemplate,
  buildCropItineraryTemplate,
} = require("../templates/emailTemplate");

// ======================================================
// Send Weather Update Email
// ======================================================

const sendWeatherAlert = async ({
  to,
  farmerName,
  crop,
  activity,
  oldDate,
  newDate,
  reason,
}) => {
  try {
    const details = [
      { label: "Crop", value: crop },
      { label: "Activity", value: activity },
      { label: "Original Scheduled Date", value: oldDate },
      { label: "Recommended Updated Date", value: newDate, highlight: true },
      { label: "Weather Reason", value: reason },
    ];

    const detailsTableHtml = buildDetailsTable(details);

    const bodyHtml = `
      <p style="margin-top: 0; color: #334155;">
        Our AI system has detected weather conditions that may affect your scheduled farming activities.
      </p>
      ${detailsTableHtml}
      <p style="font-size: 14px; color: #475569;">
        Please open FarmFleet AI to review and confirm your updated farming itinerary.
      </p>
    `;

    const html = buildOfficialEmailBody({
      categoryBadge: "Weather Schedule Alert",
      userRoleBadge: "Renter (Farmer)",
      headline: "🌦 Weather Schedule Update",
      greeting: farmerName,
      bodyHtml,
      cta: {
        text: "View Updated Itinerary",
        url: process.env.FRONTEND_URL || "http://localhost:5173",
      },
      footerNote: "Farming schedules are dynamically calculated based on real-time weather forecasts.",
    });

    await sendEmail({
      to,
      subject: "🌦 FarmFleet AI — Weather Schedule Update",
      html,
    });

    console.log("✅ Weather Alert Email Sent");
    return true;
  } catch (error) {
    console.error("❌ Failed to Send Weather Alert Email:", error);
    return false;
  }
};

// ======================================================
// Send AI Crop Itinerary Email
// ======================================================

const sendCropItinerary = async ({
  to,
  farmerName,
  crop,
  pdfLink,
}) => {
  try {
    const html = buildCropItineraryTemplate({
      farmerName,
      crop,
      pdfLink,
    });

    await sendEmail({
      to,
      subject: "🌾 Your AI Crop Itinerary is Ready — FarmFleet AI",
      html,
    });

    console.log("✅ Crop Itinerary Email Sent");
    return true;
  } catch (error) {
    console.error("❌ Failed to Send Crop Itinerary Email:", error);
    return false;
  }
};

// ======================================================
// Send Welcome Email
// ======================================================

const sendWelcomeEmail = async ({
  to,
  farmerName,
  role = "Farmer",
}) => {
  try {
    const html = buildWelcomeEmailTemplate({
      farmerName,
      role,
    });

    await sendEmail({
      to,
      subject: "Welcome to FarmFleet AI — Empowering Indian Agriculture",
      html,
    });

    console.log("✅ Welcome Email Sent");
    return true;
  } catch (error) {
    console.error("❌ Failed to Send Welcome Email:", error);
    return false;
  }
};

// ======================================================
// Export
// ======================================================

module.exports = {
  sendWeatherAlert,
  sendCropItinerary,
  sendWelcomeEmail,
};