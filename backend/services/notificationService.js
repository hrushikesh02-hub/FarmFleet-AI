const nodemailer = require("nodemailer");

// ======================================================
// Email Transport
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// Verify Connection
// ======================================================

transporter.verify((error) => {
  if (error) {
    console.log("❌ Email Configuration Error");
    console.log(error);
  } else {
    console.log("✅ Email Service Ready");
  }
});

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
    const mailOptions = {
      from: `"FarmFleet AI" <${process.env.EMAIL_USER}>`,

      to,

      subject: "🌦 FarmFleet AI - Weather Schedule Update",

      html: `
      <div style="font-family:Arial;padding:25px">

        <h2 style="color:#2E7D32">
          🌾 FarmFleet AI
        </h2>

        <h3>Hello ${farmerName},</h3>

        <p>
          Our AI has detected weather conditions that may affect your farming schedule.
        </p>

        <table
          border="1"
          cellpadding="10"
          cellspacing="0"
          style="border-collapse:collapse"
        >

          <tr>
            <td><b>Crop</b></td>
            <td>${crop}</td>
          </tr>

          <tr>
            <td><b>Activity</b></td>
            <td>${activity}</td>
          </tr>

          <tr>
            <td><b>Old Date</b></td>
            <td>${oldDate}</td>
          </tr>

          <tr>
            <td><b>Updated Date</b></td>
            <td>${newDate}</td>
          </tr>

          <tr>
            <td><b>Reason</b></td>
            <td>${reason}</td>
          </tr>

        </table>

        <br>

        <p>
          Please open FarmFleet AI to view the updated farming itinerary.
        </p>

        <br>

        <b>
          Happy Farming 🌱
        </b>

      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Weather Alert Email Sent");

    return true;
  } catch (error) {
    console.error("❌ Failed to Send Email");
    console.error(error);

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
    const mailOptions = {
      from: `"FarmFleet AI" <${process.env.EMAIL_USER}>`,

      to,

      subject: "🌾 Your AI Crop Itinerary is Ready",

      html: `
      <div style="font-family:Arial;padding:25px">

      <h2 style="color:#2E7D32">
      FarmFleet AI
      </h2>

      <h3>Hello ${farmerName},</h3>

      <p>
      Your AI-powered farming itinerary for
      <b>${crop}</b>
      has been successfully generated.
      </p>

      <p>
      You can download your farming report using the link below.
      </p>

      <a href="${pdfLink}">
      Download AI Report
      </a>

      <br><br>

      Happy Farming 🌱

      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Crop Itinerary Email Sent");

    return true;
  } catch (error) {
    console.error(error);

    return false;
  }
};

// ======================================================
// Send Welcome Email
// ======================================================

const sendWelcomeEmail = async ({
  to,
  farmerName,
}) => {
  try {
    const mailOptions = {
      from: `"FarmFleet AI" <${process.env.EMAIL_USER}>`,

      to,

      subject: "Welcome to FarmFleet AI",

      html: `
      <h2>Welcome ${farmerName}!</h2>

      <p>

      Thank you for joining FarmFleet AI.

      You can now

      ✔ Generate AI Crop Plans

      ✔ Rent Equipment

      ✔ Hire Labour

      ✔ Receive Weather Alerts

      ✔ Get AI Farming Assistance

      </p>

      <br>

      Happy Farming 🌱
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Welcome Email Sent");

    return true;
  } catch (error) {
    console.error(error);

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