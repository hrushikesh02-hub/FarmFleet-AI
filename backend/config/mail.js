const { BrevoClient } = require("@getbrevo/brevo");

/* ==========================
   BREVO (HTTP API) EMAIL
   -----------------------
   Render free tier blocks SMTP ports (25, 465, 587).
   Brevo sends emails over HTTPS — no port restrictions.
========================== */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_USER || process.env.BREVO_SENDER_EMAIL || "noreply@farmfleet.ai";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "FarmFleet AI";

let brevoClient = null;

if (BREVO_API_KEY) {
  brevoClient = new BrevoClient({ apiKey: BREVO_API_KEY });
  console.log("✅ Brevo email client initialized");
} else {
  console.warn("⚠️  BREVO_API_KEY not set — emails will be skipped");
}

/* ==========================
   SEND EMAIL FUNCTION
========================== */

const sendEmail = async ({ to, subject, html }) => {
  if (!brevoClient) {
    console.warn(`⚠️  Email skipped (no BREVO_API_KEY): ${subject} → ${to}`);
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const result = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent: html,
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
    });

    console.log(`✅ Email sent successfully to ${to} (messageId: ${result.messageId})`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Email Error:", error.message || error);
    return { success: false, error: error.message };
  }
};

/* ==========================
   EXPORTS
========================== */

module.exports = {
  sendEmail,
};