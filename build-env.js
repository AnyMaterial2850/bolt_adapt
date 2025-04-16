// Script to generate build-time environment variables
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the current version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version || '0.1.0';

// Generate the build timestamp
const buildTime = new Date().toISOString();

// Create or update the .env.production file with build info
const envFilePath = path.join(__dirname, '.env.production');
let envContent = '';

// Read existing .env.production if it exists
if (fs.existsSync(envFilePath)) {
  envContent = fs.readFileSync(envFilePath, 'utf8');
}

// Remove any existing VITE_APP_VERSION and VITE_BUILD_TIME lines
envContent = envContent
  .split('\n')
  .filter(line => !line.startsWith('VITE_APP_VERSION=') && !line.startsWith('VITE_BUILD_TIME='))
  .join('\n');

// Add the new values
envContent += `\nVITE_APP_VERSION=${version}`;
envContent += `\nVITE_BUILD_TIME=${buildTime}\n`;

// Write the updated content back to the file
fs.writeFileSync(envFilePath, envContent);

console.log(`Build environment variables updated:`);
console.log(`- VITE_APP_VERSION: ${version}`);
console.log(`- VITE_BUILD_TIME: ${buildTime}`);
