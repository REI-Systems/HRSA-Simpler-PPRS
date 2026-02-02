/**
 * Downloads the HRSA logo image to public/images/
 * Run with: node scripts/download-hrsa-logo.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOGO_URL = 'https://hrsauat2.amer.reisystems.com/LayoutService/images/HealthResourcesandServicesAdministrationlogo.png';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hrsa-logo.png');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const file = fs.createWriteStream(OUTPUT_FILE);
https.get(LOGO_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download: HTTP ${response.statusCode}`);
    process.exit(1);
  }
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`Downloaded HRSA logo to ${OUTPUT_FILE}`);
  });
}).on('error', (err) => {
  fs.unlink(OUTPUT_FILE, () => {});
  console.error('Download failed:', err.message);
  process.exit(1);
});
