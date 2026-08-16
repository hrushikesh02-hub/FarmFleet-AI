'use strict';

/**
 * ==============================================================================
 * FARMFLEET AI — OFFICIAL EMAIL TEMPLATE SYSTEM
 * ==============================================================================
 * Standardized, responsive HTML email template generator for all FarmFleet AI
 * communications sent to Owners, Renters (Farmers), Labourers, and Admins.
 */

/**
 * Master HTML Email Wrapper
 */
const buildOfficialEmailBody = ({
  categoryBadge = "Official Notification",
  userRoleBadge = "",
  headline = "",
  greeting = "",
  bodyHtml = "",
  cta = null, // { text: string, url: string }
  footerNote = "",
}) => {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FarmFleet AI Notification</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%); padding: 30px 28px; text-align: center; color: #ffffff;">
              <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
                🚜 FarmFleet AI
              </div>
              <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #dcfce7; margin-top: 6px;">
                ${categoryBadge}
              </div>
            </td>
          </tr>

          <!-- Role Context Notice Bar (if specified) -->
          ${
            userRoleBadge
              ? `
          <tr>
            <td style="background-color: #f0fdf4; border-bottom: 1px solid #dcfce7; padding: 10px 28px; text-align: center; font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.6px;">
              Notice for ${userRoleBadge}
            </td>
          </tr>
          `
              : ""
          }

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 32px 28px 24px 28px; color: #1e293b; font-size: 15px; line-height: 1.6;">
              ${
                headline
                  ? `<h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #0f172a;">${headline}</h2>`
                  : ""
              }
              ${
                greeting
                  ? `<p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">Hello <strong>${greeting}</strong>,</p>`
                  : ""
              }
              
              <!-- Custom Body Content -->
              ${bodyHtml}
              
              <!-- Call To Action Button (Optional) -->
              ${
                cta && cta.url && cta.text
                  ? `
              <div style="margin-top: 28px; margin-bottom: 16px; text-align: center;">
                <a href="${cta.url}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                  ${cta.text}
                </a>
              </div>
              `
                  : ""
              }
            </td>
          </tr>

          ${
            footerNote
              ? `
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <p style="margin: 0; font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #16a34a;">
                ${footerNote}
              </p>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer Divider -->
          <tr>
            <td style="padding: 0 28px;">
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0;" />
            </td>
          </tr>

          <!-- Official Footer Section -->
          <tr>
            <td style="padding: 24px 28px; background-color: #fafafa; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
              <div style="font-weight: 700; color: #166534; font-size: 13px; margin-bottom: 4px;">
                FarmFleet AI Platform
              </div>
              <div style="color: #64748b; margin-bottom: 12px;">
                Empowering Farmers, Equipment Owners & Agricultural Labourers
              </div>
              <p style="margin: 4px 0; color: #94a3b8; font-size: 11px;">
                This is an official automated notification from FarmFleet AI. Please do not reply directly.
              </p>
              <p style="margin: 4px 0; color: #cbd5e1; font-size: 11px;">
                © ${currentYear} FarmFleet AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Helper to generate key-value detail card table
 */
const buildDetailsTable = (details = []) => {
  if (!details || details.length === 0) return "";

  const rows = details
    .map(
      ({ label, value, highlight, isStatus }) => `
    <tr>
      <td style="padding: 10px 14px; background-color: #f8fafc; font-size: 13px; color: #64748b; font-weight: 600; width: 38%; border-top: 1px solid #e2e8f0;">
        ${label}
      </td>
      <td style="padding: 10px 14px; font-size: 14px; color: ${
        highlight ? "#16a34a" : isStatus ? "#d97706" : "#1e293b"
      }; font-weight: ${
        highlight || isStatus ? "700" : "500"
      }; border-left: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;">
        ${value}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${rows}
      </table>
    </div>
  `;
};

/**
 * ==============================================================================
 * SPECIFIC EMAIL TEMPLATES
 * ==============================================================================
 */

/**
 * 1. Verification OTP Email Template
 */
const buildOTPTemplate = ({ role = "User", otp, expiryMinutes = 5 }) => {
  const roleDisplay = role.toLowerCase().includes("owner")
    ? "Equipment Owner"
    : role.toLowerCase().includes("labour")
    ? "Labour Worker"
    : "Renter (Farmer)";

  const bodyHtml = `
    <p style="margin-top: 0; color: #475569;">
      Thank you for registering with FarmFleet AI. Please use the verification code below to verify your email address.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #166534; letter-spacing: 1px; margin-bottom: 8px;">
        Verification Code
      </div>
      <div style="font-size: 38px; font-weight: 800; color: #16a34a; letter-spacing: 8px; font-family: monospace;">
        ${otp}
      </div>
      <div style="font-size: 13px; color: #475569; margin-top: 8px;">
        This OTP is valid for <strong>${expiryMinutes} minutes</strong>.
      </div>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      If you did not request this verification code, please ignore this email.
    </p>
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Email Verification",
    userRoleBadge: roleDisplay,
    headline: "Verify Your Email Address",
    bodyHtml,
    footerNote: "Do not share this OTP code with anyone for security purposes.",
  });
};

/**
 * 2. Welcome Email Template
 */
const buildWelcomeEmailTemplate = ({ farmerName, role = "Farmer" }) => {
  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">
      Welcome to <strong>FarmFleet AI</strong> — India's premier AI-powered agricultural equipment rental & labour ecosystem!
    </p>
    <p style="color: #334155;">
      Here is what you can do with your FarmFleet AI account:
    </p>
    <ul style="padding-left: 20px; color: #1e293b; line-height: 1.8;">
      <li>🌾 <strong>Generate AI Crop Plans:</strong> Receive localized farming itineraries and weather forecasts.</li>
      <li>🚜 <strong>Rent Farm Equipment:</strong> Find verified tractors, harvesters, and tools near you.</li>
      <li>👷 <strong>Hire Skilled Labour:</strong> Connect directly with local agricultural workers.</li>
      <li>🌦 <strong>Weather Alerts:</strong> Stay informed with AI-driven weather activity updates.</li>
    </ul>
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Welcome to FarmFleet",
    userRoleBadge: role,
    headline: `Welcome to FarmFleet AI!`,
    greeting: farmerName,
    bodyHtml,
    cta: {
      text: "Explore FarmFleet AI",
      url: process.env.FRONTEND_URL || "http://localhost:5173",
    },
  });
};

/**
 * 3. Booking Email Template (Create / Accept / Reject / Complete)
 */
const buildBookingEmailTemplate = ({
  role = "Owner",
  headline,
  recipientName,
  message,
  details = [],
  cta = null,
  footerNote = "",
}) => {
  const detailsTableHtml = buildDetailsTable(details);

  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">${message}</p>
    ${detailsTableHtml}
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Equipment Booking Update",
    userRoleBadge: role,
    headline,
    greeting: recipientName,
    bodyHtml,
    cta,
    footerNote,
  });
};

/**
 * 4. Labour Request Email Template (Create / Accept / Complete)
 */
const buildLabourRequestEmailTemplate = ({
  role = "Labour",
  headline,
  recipientName,
  message,
  details = [],
  cta = null,
  footerNote = "",
}) => {
  const detailsTableHtml = buildDetailsTable(details);

  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">${message}</p>
    ${detailsTableHtml}
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Labour Request Notification",
    userRoleBadge: role,
    headline,
    greeting: recipientName,
    bodyHtml,
    cta,
    footerNote,
  });
};

/**
 * 5. AI Crop Itinerary Email Template
 */
const buildCropItineraryTemplate = ({ farmerName, crop, pdfLink }) => {
  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">
      Your AI-powered farming itinerary for crop <strong>${crop}</strong> has been successfully generated!
    </p>
    <p style="color: #334155;">
      You can download your detailed farming advisory report using the button below.
    </p>
  `;

  return buildOfficialEmailBody({
    categoryBadge: "AI Crop Itinerary",
    userRoleBadge: "Renter (Farmer)",
    headline: "Your Crop Plan Is Ready",
    greeting: farmerName,
    bodyHtml,
    cta: {
      text: "Download AI Crop Report",
      url: pdfLink,
    },
    footerNote: "Follow FarmFleet AI recommendations for optimal crop yield.",
  });
};

/**
 * 6. Contact Inquiry Email Template
 */
const buildContactEmailTemplate = ({
  senderName,
  senderEmail,
  userRole,
  userId,
  subject,
  message,
}) => {
  const details = [
    { label: "Sender Name", value: senderName },
    { label: "Email Address", value: senderEmail },
    { label: "User Role", value: userRole },
    ...(userId ? [{ label: "User ID", value: userId }] : []),
    { label: "Subject", value: subject },
  ];

  const detailsTableHtml = buildDetailsTable(details);

  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">
      A new contact inquiry has been submitted via the FarmFleet AI system:
    </p>
    ${detailsTableHtml}
    <p style="margin-bottom: 8px; font-weight: 600; color: #1e293b;">Message Content:</p>
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 10px; font-size: 14px; color: #1e293b; white-space: pre-wrap; line-height: 1.6; border: 1px solid #e2e8f0;">
      ${message}
    </div>
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Support Inquiry",
    userRoleBadge: "System Admin",
    headline: "New Contact Message Received",
    bodyHtml,
    footerNote: "Please reply directly to the sender email address above.",
  });
};

/**
 * 7. Owner Booking Reminder Email Template (Sent 1 day before booking)
 */
const buildOwnerBookingReminderTemplate = ({
  ownerName,
  renterName,
  equipmentName,
  startDate,
  endDate,
  location,
  totalAmount,
}) => {
  const details = [
    { label: "Equipment", value: equipmentName, highlight: true },
    ...(startDate ? [{ label: "Booking Date", value: startDate }] : []),
    ...(endDate && endDate !== startDate ? [{ label: "End Date", value: endDate }] : []),
    ...(renterName ? [{ label: "Renter", value: renterName }] : []),
    ...(location ? [{ label: "Location", value: location }] : []),
    ...(totalAmount !== undefined && totalAmount !== null ? [{ label: "Total Amount", value: `₹${Number(totalAmount).toLocaleString("en-IN")}` }] : []),
    { label: "Status", value: "Confirmed (Tomorrow)", isStatus: true },
  ];

  const detailsTableHtml = buildDetailsTable(details);

  const bodyHtml = `
    <p style="margin-top: 0; color: #334155;">
      This is a reminder that you have a confirmed equipment booking scheduled for <strong>tomorrow</strong>.
    </p>
    ${detailsTableHtml}
    <p style="margin-top: 16px; color: #475569; font-size: 14px;">
      Please ensure your equipment is inspected, fueled, and ready for pickup or handover at the scheduled time.
    </p>
  `;

  return buildOfficialEmailBody({
    categoryBadge: "Booking Reminder",
    userRoleBadge: "Equipment Owner",
    headline: "Your FarmFleet Booking is Tomorrow 🚜",
    greeting: ownerName,
    bodyHtml,
    cta: {
      text: "View Booking in Dashboard",
      url: `${process.env.FRONTEND_URL || "https://farmfleetai.vercel.app"}/owner/login`,
    },
    footerNote: "Prompt handover ensures high renter ratings and repeat business on FarmFleet AI.",
  });
};

module.exports = {
  buildOfficialEmailBody,
  buildDetailsTable,
  buildOTPTemplate,
  buildWelcomeEmailTemplate,
  buildBookingEmailTemplate,
  buildLabourRequestEmailTemplate,
  buildCropItineraryTemplate,
  buildContactEmailTemplate,
  buildOwnerBookingReminderTemplate,
};

