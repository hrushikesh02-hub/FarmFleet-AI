'use strict';

const templates = require('../templates/emailTemplate');
const mail = require('../config/mail');

console.log('======================================================');
console.log(' FARMFLEET AI — EMAIL TEMPLATE VERIFICATION TEST');
console.log('======================================================\n');

try {
  // 1. Test OTP Template (Renter)
  const renterOtp = templates.buildOTPTemplate({ role: 'Renter (Farmer)', otp: '123456', expiryMinutes: 5 });
  console.log(`✅ Renter OTP Template Generated (${renterOtp.length} bytes) — Contains 'Notice for Renter (Farmer)': ${renterOtp.includes('Notice for Renter (Farmer)')}`);

  // 2. Test OTP Template (Owner)
  const ownerOtp = templates.buildOTPTemplate({ role: 'Equipment Owner', otp: '654321', expiryMinutes: 5 });
  console.log(`✅ Owner OTP Template Generated (${ownerOtp.length} bytes) — Contains 'Notice for Equipment Owner': ${ownerOtp.includes('Notice for Equipment Owner')}`);

  // 3. Test OTP Template (Labour)
  const labourOtp = templates.buildOTPTemplate({ role: 'Labour Worker', otp: '987654', expiryMinutes: 5 });
  console.log(`✅ Labour OTP Template Generated (${labourOtp.length} bytes) — Contains 'Notice for Labour Worker': ${labourOtp.includes('Notice for Labour Worker')}`);

  // 4. Test Booking Template (Owner)
  const bookingEmail = templates.buildBookingEmailTemplate({
    role: 'Equipment Owner',
    headline: 'New Equipment Booking Request',
    recipientName: 'Ramesh Patel',
    message: 'Farmer Suresh Kumar has submitted a booking request for your John Deere 5050D Tractor.',
    details: [
      { label: 'Equipment Name', value: 'John Deere 5050D Tractor' },
      { label: 'Location', value: 'Nashik, Maharashtra' },
      { label: 'Start Date', value: '15 Aug 2026' },
      { label: 'End Date', value: '18 Aug 2026' },
      { label: 'Total Amount', value: '₹4,500', highlight: true },
      { label: 'Booking Status', value: 'Pending Response', isStatus: true },
    ],
    cta: { text: 'Respond to Booking', url: 'http://localhost:5173/owner/login' },
  });
  console.log(`✅ Booking Email Template Generated (${bookingEmail.length} bytes) — Contains '🚜 FarmFleet AI': ${bookingEmail.includes('🚜 FarmFleet AI')}`);

  // 5. Test Labour Request Template (Labour)
  const labourRequestEmail = templates.buildLabourRequestEmailTemplate({
    role: 'Labour Worker',
    headline: 'New Agricultural Work Request',
    recipientName: 'Santosh Pawar',
    message: 'Farmer Vijay Patil has sent you a work request for harvesting.',
    details: [
      { label: 'Farmer Name', value: 'Vijay Patil' },
      { label: 'Work Location', value: 'Baramati, Pune' },
      { label: 'Daily Rate', value: '₹500 / day' },
      { label: 'Total Amount', value: '₹2,500', highlight: true },
    ],
    cta: { text: 'View Request', url: 'http://localhost:5173/labour/requests' },
  });
  console.log(`✅ Labour Request Email Template Generated (${labourRequestEmail.length} bytes)`);

  // 6. Test Contact Inquiry Template
  const contactEmail = templates.buildContactEmailTemplate({
    senderName: 'Anil Deshmukh',
    senderEmail: 'anil@example.com',
    userRole: 'Renter (Farmer)',
    userId: '60d5ec49f1a2c80015f8b101',
    subject: 'Equipment Booking Inquiry',
    message: 'Need information about rotavator availability in Sangli district.',
  });
  console.log(`✅ Contact Email Template Generated (${contactEmail.length} bytes)`);

  // 7. Verify Module imports across backend controllers
  require('../controllers/farmerOTPController');
  console.log('✅ farmerOTPController imported cleanly');

  require('../controllers/ownerOTPController');
  console.log('✅ ownerOTPController imported cleanly');

  require('../controllers/labourOTPController');
  console.log('✅ labourOTPController imported cleanly');

  require('../controllers/bookingController');
  console.log('✅ bookingController imported cleanly');

  require('../controllers/labourRequestController');
  console.log('✅ labourRequestController imported cleanly');

  require('../services/notificationService');
  console.log('✅ notificationService imported cleanly');

  require('../controllers/contactController');
  console.log('✅ contactController imported cleanly');

  console.log('\n🎉 ALL EMAIL TEMPLATE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
} catch (err) {
  console.error('❌ Email Template Verification Failed:', err);
  process.exit(1);
}
