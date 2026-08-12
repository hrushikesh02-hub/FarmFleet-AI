'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Open-source Noto Sans font URLs (Google Fonts GitHub releases/raw)
const FONT_URLS = {
  'NotoSansDevanagari-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
  'NotoSansGujarati-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf',
  'NotoSansTamil-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf',
  'NotoSansTelugu-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf',
  'NotoSansKannada-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf',
  'NotoSansGurmukhi-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansGurmukhi/NotoSansGurmukhi-Regular.ttf',
};

function downloadFont(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFont(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('Downloading Noto Sans fonts for PDFKit...');
  for (const [filename, url] of Object.entries(FONT_URLS)) {
    const dest = path.join(fontsDir, filename);
    console.log(`Downloading ${filename}...`);
    try {
      await downloadFont(url, dest);
      console.log(`✅ Saved ${filename} (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`❌ Failed to download ${filename}:`, err.message);
    }
  }
}

main();
