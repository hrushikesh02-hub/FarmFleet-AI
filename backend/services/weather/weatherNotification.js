const { sendEmail } = require("../../config/mail");

/* ======================================================
   Weather Icons
====================================================== */

const getWeatherIcon = (weather = "") => {
  const value = weather.toLowerCase();

  if (value.includes("storm")) return "⛈";
  if (value.includes("rain")) return "🌧";
  if (value.includes("snow")) return "❄";
  if (value.includes("fog") || value.includes("mist")) return "🌫";
  if (value.includes("cloud")) return "☁";
  if (value.includes("clear") || value.includes("sun")) return "☀";

  return "🌤";
};

/* ======================================================
   Severity Badge
====================================================== */

const getSeverityStyle = (severity = "Low") => {
  switch (severity.toLowerCase()) {
    case "high":
      return { color: "#dc2626", bg: "#fee2e2", icon: "🔴" };
    case "medium":
      return { color: "#d97706", bg: "#fef3c7", icon: "🟠" };
    default:
      return { color: "#15803d", bg: "#dcfce7", icon: "🟢" };
  }
};

/* ======================================================
   Small formatting helpers
====================================================== */

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";

const getReportLink = (itineraryId) =>
  `${getFrontendUrl()}/renter/ai/report/${itineraryId}`;

const getGeneratedTimestamp = () => {
  const now = new Date();

  const datePart = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const timePart = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return `${datePart}, ${timePart}`;
};

/* ======================================================
   Build Email Template
   (table-based layout for Gmail / Outlook compatibility)
====================================================== */

const buildWeatherAlertTemplate = ({
  farmerName,
  crop,
  district,
  activity,
  activityDate,
  suggestedDate,
  weatherCondition,
  reason,
  recommendation,
  severity,
  delayDays,
  itineraryId,
}) => {
  const badge = getSeverityStyle(severity);
  const weatherIcon = getWeatherIcon(weatherCondition);
  const reportLink = getReportLink(itineraryId);
  const generatedAt = getGeneratedTimestamp();

  const delaySection =
    delayDays > 0
      ? `<tr>
           <td style="padding-top:14px;">
             <span style="font-size:14px;color:#166534;">
               <strong>Suggested Delay:</strong> ${delayDays} day(s)
             </span>
           </td>
         </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FarmFleet Weather Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color:#16a34a;padding:28px 24px;text-align:center;">
              <div style="font-size:24px;font-weight:bold;color:#ffffff;">🌾 FarmFleet AI</div>
              <div style="font-size:15px;color:#dcfce7;margin-top:6px;">Weather Alert</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <p style="font-size:17px;color:#111827;margin:0 0 8px 0;">
                Hello ${farmerName},
              </p>
              <p style="font-size:14px;line-height:1.7;color:#4b5563;margin:0;">
                FarmFleet AI has detected weather conditions that may affect one of your upcoming
                farming activities. Please review the details below.
              </p>
            </td>
          </tr>

          <!-- Weather Summary Card -->
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#6b7280;font-weight:bold;width:40%;">Crop</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-left:1px solid #e5e7eb;">${crop}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#6b7280;font-weight:bold;border-top:1px solid #e5e7eb;">District</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-left:1px solid #e5e7eb;border-top:1px solid #e5e7eb;">${district}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#6b7280;font-weight:bold;border-top:1px solid #e5e7eb;">Activity</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-left:1px solid #e5e7eb;border-top:1px solid #e5e7eb;">${activity}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#6b7280;font-weight:bold;border-top:1px solid #e5e7eb;">Weather Condition</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;border-left:1px solid #e5e7eb;border-top:1px solid #e5e7eb;">${weatherIcon} ${weatherCondition}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f8fafc;font-size:13px;color:#6b7280;font-weight:bold;border-top:1px solid #e5e7eb;">Severity</td>
                  <td style="padding:12px 16px;border-left:1px solid #e5e7eb;border-top:1px solid #e5e7eb;">
                    <span style="display:inline-block;padding:4px 12px;border-radius:14px;background-color:${badge.bg};color:${badge.color};font-size:13px;font-weight:bold;">
                      ${badge.icon} ${severity}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Date Comparison -->
          <tr>
            <td style="padding:24px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background-color:#f8fafc;border-radius:10px;padding:16px;vertical-align:top;">
                    <div style="font-size:12px;color:#6b7280;font-weight:bold;">ORIGINAL SCHEDULED DATE</div>
                    <div style="font-size:16px;color:#111827;font-weight:bold;margin-top:6px;">${activityDate}</div>
                  </td>
                  <td width="4%">&nbsp;</td>
                  <td width="48%" style="background-color:#ecfdf5;border-radius:10px;padding:16px;vertical-align:top;">
                    <div style="font-size:12px;color:#166534;font-weight:bold;">RECOMMENDED DATE</div>
                    <div style="font-size:16px;color:#16a34a;font-weight:bold;margin-top:6px;">${suggestedDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reason -->
          <tr>
            <td style="padding:24px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border-left:4px solid #f97316;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:14px;font-weight:bold;color:#9a3412;margin-bottom:6px;">Why was this recommendation generated?</div>
                    <div style="font-size:14px;line-height:1.6;color:#7c2d12;">${reason}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Recommendation -->
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:14px;font-weight:bold;color:#166534;margin-bottom:6px;">FarmFleet AI Recommendation</div>
                    <div style="font-size:14px;line-height:1.6;color:#14532d;">${recommendation}</div>
                    <table role="presentation" cellpadding="0" cellspacing="0">${delaySection}</table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 24px 0 24px;text-align:center;">
              <a href="${reportLink}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:8px;font-size:15px;font-weight:bold;">
                View Updated Crop Plan
              </a>
            </td>
          </tr>

          <!-- Timestamp -->
          <tr>
            <td style="padding:20px 24px 0 24px;text-align:center;">
              <div style="font-size:12px;color:#9ca3af;">Alert Generated: ${generatedAt}</div>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;line-height:1.6;color:#6b7280;">
                    This recommendation has been generated automatically using FarmFleet AI and the
                    latest available weather forecast. Please also consider actual field conditions
                    before making farming decisions.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <div style="font-size:13px;color:#374151;font-weight:bold;">FarmFleet AI</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:4px;">Helping Indian Farmers Make Better Decisions</div>
              <div style="font-size:11px;color:#c1c7d0;margin-top:10px;">© ${new Date().getFullYear()} FarmFleet AI</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/* ======================================================
   Send Weather Alert Email
====================================================== */

const sendWeatherAlertEmail = async ({
  farmerName,
  email,
  crop,
  district,
  activity,
  activityDate,
  suggestedDate,
  weatherCondition,
  reason,
  recommendation,
  severity,
  delayDays,
  itineraryId,
}) => {
  if (!email) {
    const error = new Error("Weather Notification: recipient email is missing.");
    console.error(error.message);
    throw error;
  }

  try {
    const html = buildWeatherAlertTemplate({
      farmerName,
      crop,
      district,
      activity,
      activityDate,
      suggestedDate,
      weatherCondition,
      reason,
      recommendation,
      severity,
      delayDays,
      itineraryId,
    });

    await sendEmail({
      to: email,
      subject: `⚠ FarmFleet AI | Weather Alert for ${crop}`,
      html,
    });

    console.log(`Weather Notification | Recipient: ${email} | Weather Alert Sent Successfully`);

    return {
      success: true,
      email,
    };
  } catch (error) {
    console.error(`Weather Notification Error | Recipient: ${email} | ${error.message}`);
    throw error;
  }
};

/* ======================================================
   Export
====================================================== */

module.exports = {
  sendWeatherAlertEmail,
  getWeatherIcon,
  getSeverityStyle,
};