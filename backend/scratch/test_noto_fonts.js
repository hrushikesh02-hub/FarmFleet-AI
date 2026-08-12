'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');

const testCases = [
  { lang: 'English', fontName: 'Helvetica', text: 'FarmFleet AI — Smart Farming Report' },
  { lang: 'Hindi', file: 'NotoSansDevanagari-Regular.ttf', fontName: 'NotoDevanagari', text: 'फार्मफ्लीट एआई — स्मार्ट फार्मिंग रिपोर्ट (हिंदी)' },
  { lang: 'Marathi', file: 'NotoSansDevanagari-Regular.ttf', fontName: 'NotoDevanagari', text: 'फार्मफ्लीट एआई — शेती साधनसामग्री अहवाल (मराठी)' },
  { lang: 'Gujarati', file: 'NotoSansGujarati-Regular.ttf', fontName: 'NotoGujarati', text: 'ફાર્મફ્લીટ એઆઈ — સ્માર્ટ ખેતી અહેવાલ (ગુજરાતી)' },
  { lang: 'Tamil', file: 'NotoSansTamil-Regular.ttf', fontName: 'NotoTamil', text: 'ஃபார்ம்ஃப்ளீட் ஏஐ — விவசாய அறிக்கை (தமிழ்)' },
  { lang: 'Telugu', file: 'NotoSansTelugu-Regular.ttf', fontName: 'NotoTelugu', text: 'ఫార్మ్‌ఫ్లీట్ ఏఐ — వ్యవసాయ నివేదిక (తెలుగు)' },
  { lang: 'Kannada', file: 'NotoSansKannada-Regular.ttf', fontName: 'NotoKannada', text: 'ಫಾರ್ಮ್‌ಫ್ಲೀಟ್ ಎಐ — ಕೃಷಿ ವರದಿ (ಕನ್ನಡ)' },
  { lang: 'Punjabi', file: 'NotoSansGurmukhi-Regular.ttf', fontName: 'NotoGurmukhi', text: 'ਫਾਰਮਫਲੀਟ ਏਆਈ — ਖੇਤੀਬਾੜੀ ਰਿਪੋਰਟ (ਪੰਜਾਬੀ)' },
];

async function testPDFGeneration() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const pdfPath = path.join(__dirname, 'test_multilingual_noto.pdf');
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  console.log('Registering fonts...');
  for (const tc of testCases) {
    if (tc.file) {
      const fullPath = path.join(fontsDir, tc.file);
      if (fs.existsSync(fullPath)) {
        doc.registerFont(tc.fontName, fullPath);
        console.log(`Registered ${tc.fontName} from ${tc.file}`);
      } else {
        console.error(`Font missing: ${tc.file}`);
      }
    }
  }

  doc.fontSize(20).text('FarmFleet AI Multilingual Test', { align: 'center' });
  doc.moveDown(1.5);

  for (const tc of testCases) {
    doc.fontSize(12).fillColor('#2E7D32').text(`Language: ${tc.lang}`);
    if (tc.fontName !== 'Helvetica') {
      doc.font(tc.fontName);
    } else {
      doc.font('Helvetica');
    }
    doc.fontSize(14).fillColor('#263238').text(tc.text);
    doc.moveDown(1);
  }

  doc.end();

  stream.on('finish', () => {
    console.log(`✅ Test PDF created successfully: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);
  });
}

testPDFGeneration().catch(console.error);
