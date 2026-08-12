'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

console.log('Testing PDFKit Font Registration...');

const doc = new PDFDocument({ size: 'A4' });
const outputPath = path.join(__dirname, 'test_output.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const fontPath = 'C:\\Windows\\Fonts\\Nirmala.ttc';
console.log('Exists Nirmala.ttc:', fs.existsSync(fontPath));

if (fs.existsSync(fontPath)) {
  try {
    // Try registering Nirmala UI from TTC
    doc.registerFont('Nirmala', fontPath, 'Nirmala UI');
    doc.font('Nirmala').fontSize(16);
    
    doc.text('English: FarmFleet AI Smart Farming Report');
    doc.text('Hindi: फार्मफ्लीट एआई - किसान और उपकरण');
    doc.text('Marathi: शेती उपकरणे भाड्याने घेणे');
    doc.text('Gujarati: ખેડૂત અને ટ્રેક્ટર સેવાઓ');
    doc.text('Tamil: விவசாய உபகரணங்கள் வாடகை');
    doc.text('Telugu: వ్యవసాయ పరికరాల అద్దె');
    doc.text('Kannada: ರೈತ ಮತ್ತು ಕೃಷಿ ಉಪಕರಣಗಳು');
    doc.text('Punjabi: ਕਿਸਾਨ ਅਤੇ ਟਰੈਕਟਰ ਕਿਰਾਏ');

    console.log('Successfully wrote text with Nirmala!');
  } catch (err) {
    console.error('Error with Nirmala:', err);
  }
}

doc.end();

stream.on('finish', () => {
  console.log('PDF generated at:', outputPath, 'Size:', fs.statSync(outputPath).size);
});
