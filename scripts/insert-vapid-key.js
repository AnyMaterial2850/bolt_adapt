const fs = require('fs');
const path = require('path');

const envFilePath = path.resolve(__dirname, '../bolt_adapt/.env');
const testHtmlPath = path.resolve(__dirname, '../bolt_adapt/public/minimal-push-test.html');

function getVapidKey() {
  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  const match = envContent.match(/^VITE_VAPID_PUBLIC_KEY=(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  throw new Error('VITE_VAPID_PUBLIC_KEY not found in .env');
}

function insertVapidKey() {
  const vapidKey = getVapidKey();
  let htmlContent = fs.readFileSync(testHtmlPath, 'utf-8');
  htmlContent = htmlContent.replace(/__VITE_VAPID_PUBLIC_KEY__/g, vapidKey);
  fs.writeFileSync(testHtmlPath, htmlContent, 'utf-8');
  console.log('VAPID public key inserted into minimal-push-test.html');
}

module.exports = { insertVapidKey };
