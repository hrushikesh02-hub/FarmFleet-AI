'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pdfTemplates = require('../services/pdf/pdfTemplates');
const { page: pageTokens } = require('../services/pdf/pdfStyles');
const { registerAllFonts } = require('../services/pdf/pdfFontHelper');

const outputDir = path.join(__dirname, 'reports_test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const languages = [
  { code: 'en', name: 'English', farmer: 'Rajesh Patil', crop: 'Sugarcane', location: 'Nashik, Maharashtra' },
  { code: 'hi', name: 'Hindi', farmer: 'राजेश पाटिल', crop: 'गन्ना (Sugarcane)', location: 'नाशिक, महाराष्ट्र' },
  { code: 'mr', name: 'Marathi', farmer: 'राजेश पाटील', crop: 'ऊस (Sugarcane)', location: 'नाशिक, महाराष्ट्र' },
  { code: 'gu', name: 'Gujarati', farmer: 'રાજેશ પટેલ', crop: 'શેરડી (Sugarcane)', location: 'સુરત, ગુજરાત' },
  { code: 'ta', name: 'Tamil', farmer: 'ராஜேஷ் பட்டேல்', crop: 'கரும்பு (Sugarcane)', location: 'கோயம்புத்தூர், தமிழ்நாடு' },
  { code: 'te', name: 'Telugu', farmer: 'రాజేష్ పటేల్', crop: 'చెరకు (Sugarcane)', location: 'గుంటూరు, ఆంధ్రప్రదేశ్' },
  { code: 'kn', name: 'Kannada', farmer: 'ರಾಜೇಶ್ ಪಾಟೀಲ್', crop: 'ಕಬ್ಬು (Sugarcane)', location: 'ಬೆಳಗಾವಿ, ಕರ್ನಾಟಕ' },
  { code: 'pa', name: 'Punjabi', farmer: 'ਰਾਜੇਸ਼ ਪਾਟਿਲ', crop: 'ਕਮਾਦ (Sugarcane)', location: 'ਲੁਧਿਆਣਾ, ਪੰਜਾਬ' },
];

function buildMockReport(langObj) {
  return {
    reportId: `FF-TEST-${langObj.code.toUpperCase()}`,
    generatedDate: '12 Aug 2026',
    loginUrl: 'https://farmfleet.ai/itinerary/test',
    language: langObj.code,

    farmer: {
      name: langObj.farmer,
    },

    crop: langObj.crop,
    landArea: '5 Acres',

    location: {
      state: langObj.location.split(',')[1]?.trim() || 'Maharashtra',
      district: langObj.location.split(',')[0]?.trim() || 'Nashik',
    },

    soilType: 'Black Cotton Soil',
    waterSource: 'Borewell / Drip',
    budget: '₹1,50,000',
    season: 'Kharif 2026',
    seedRecommendation: 'Co 86032 (Nayana)',

    summary: {
      cropDuration: '12 - 14 Months',
      expectedYield: '40-50 Tons / Acre',
      estimatedCost: '₹1,50,000',
      estimatedIncome: '₹4,00,000',
      estimatedProfit: '₹2,50,000',
      riskLevel: 'Low Risk',
      todaysTask: 'Soil Preparation & Basal Fertilizer Application',
      aiRecommendation: 'Ensure soil moisture is optimal before planting.',
    },

    weather: {
      temperature: 29,
      humidity: 68,
      windSpeed: 12,
      rainProbability: 20,
      condition: 'Partly Cloudy',
      recommendation: 'Good conditions for field activities.',
    },

    timeline: [
      { week: 1, title: 'Land Preparation', description: 'Deep ploughing and harrowing', scheduledDate: '2026-08-15', status: 'Completed' },
      { week: 2, title: 'Basal Fertilizer Application', description: 'Apply SSP and MOP', scheduledDate: '2026-08-22', status: 'Upcoming' },
      { week: 4, title: 'First Irrigation', description: 'Light irrigation post planting', scheduledDate: '2026-09-05', status: 'Upcoming' },
    ],

    equipment: [
      { name: 'Mahindra 575 DI Tractor', purpose: 'Ploughing', estimatedRent: '₹1,200 / hour' },
      { name: 'Rotavator', purpose: 'Soil tilling', estimatedRent: '₹800 / hour' },
    ],

    labour: [
      { activity: 'Sowing & Planting', workers: '4 workers', estimatedDays: '2 days' },
      { activity: 'Weeding', workers: '3 workers', estimatedDays: '1 day' },
    ],

    fertilizer: [
      { stage: 'Basal Application', fertilizer: 'Single Super Phosphate (SSP)', quantity: '100 kg/acre', time: 'Day 1' },
      { stage: 'Top Dressing', fertilizer: 'Urea', quantity: '50 kg/acre', time: 'Day 30' },
    ],

    irrigation: [
      { stage: 'Initial Stage', frequency: 'Every 7 days', waterRequirement: '25 mm' },
      { stage: 'Growth Stage', frequency: 'Every 5 days', waterRequirement: '40 mm' },
    ],

    precautions: [
      'Avoid waterlogging during early seedling stage.',
      'Monitor for stem borer infestation regularly.',
    ],
    tips: [
      'Maintain drip irrigation pressure at 1.5 bar for uniform water distribution.',
    ],
    importantNotes: 'Keep field records updated for crop insurance eligibility.',
    todaysReminder: 'Check fertilizer availability with local supplier.',
  };
}

async function run() {
  console.log('Testing full PDF generation pipeline for all 8 languages...');
  for (const langObj of languages) {
    const report = buildMockReport(langObj);
    const pdfPath = path.join(outputDir, `FarmFleet_Report_${langObj.code.toUpperCase()}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: pageTokens.size,
        margins: pageTokens.margins,
        bufferPages: true,
      });

      doc._currentLanguage = report.language;
      registerAllFonts(doc);

      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      doc.on('error', reject);

      doc.pipe(writeStream);

      pdfTemplates.drawCoverPage(doc, report);
      pdfTemplates.drawFarmInformation(doc, report);
      pdfTemplates.drawTimelinePage(doc, report);
      pdfTemplates.drawEquipmentPage(doc, report);
      pdfTemplates.drawLabourPage(doc, report);
      pdfTemplates.drawFertilizerPage(doc, report);
      pdfTemplates.drawIrrigationPage(doc, report);
      pdfTemplates.drawWeatherPage(doc, report);
      pdfTemplates.drawPrecautionsPage(doc, report);
      pdfTemplates.drawFinalPage(doc, report);

      doc.end();
    });

    console.log(`✅ [${langObj.name}] Generated: ${path.basename(pdfPath)} (${fs.statSync(pdfPath).size} bytes)`);
  }
  console.log('🎉 All 8 multilingual PDFs generated successfully!');
}

run().catch((err) => {
  console.error('❌ PDF Generation Error:', err);
  process.exit(1);
});
