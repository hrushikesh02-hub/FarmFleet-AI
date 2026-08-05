const nodemailer = require("nodemailer");

/* ==========================
   NODEMAILER TRANSPORTER
========================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ==========================
   SEND EMAIL FUNCTION
========================== */

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    await transporter.sendMail({
      from: `"FarmFleet" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(
      `✅ Email sent successfully to ${to}`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "❌ Email Error:",
      error
    );

    throw error;
  }
};

/* ==========================
   EXPORTS
========================== */

module.exports = {
  transporter,
  sendEmail,
};