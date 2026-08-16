const nodemailer = require("nodemailer");
const dns = require("dns");

/* ==========================
   NODEMAILER TRANSPORTER
========================== */

// Force IPv4 DNS resolution to prevent ENETUNREACH on Render (no IPv6 support)
const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // TLS via STARTTLS
  family: 4,
  dnsLookup: ipv4Lookup,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false,
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
    const sender = process.env.EMAIL_USER || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `"FarmFleet AI" <${sender}>`,
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
      error.message || error
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

/* ==========================
   EXPORTS
========================== */

module.exports = {
  transporter,
  sendEmail,
};