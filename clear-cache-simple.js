// A simple script to clear service worker caches using plain JavaScript
// This avoids the JSX parsing issues with the more complex approach

import fs from 'fs';

// Create a simple HTML page that will clear the cache
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Clear Service Worker Cache</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    button {
      padding: 10px 15px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    #log {
      margin-top: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      height: 200px;
      overflow-y: auto;
    }
    .success { color: #4caf50; }
    .error { color: #f44336; }
  </style>
</head>
<body>
  <h1>Clear Service Worker Cache</h1>
  <p>This utility helps fix issues with the habit completion tracking by clearing any cached versions of the files.</p>
  
  <button id="clearButton">Clear All Caches</button>
  <div id="log"></div>

  <script>
    // Simple logging function
    function log(message, type) {
      const logDiv = document.getElementById('log');
      const entry = document.createElement('div');
      entry.textContent = message;
      if (type) entry.className = type;
      logDiv.appendChild(entry);
      logDiv.scrollTop = logDiv.scrollHeight;
    }

    // Clear caches and service workers
    async function clearCaches() {
      log('Starting cache clearing process...');
      
      try {
        // Unregister service workers
        if ('serviceWorker' in navigator) {
          log('Unregistering service workers...');
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length === 0) {
            log('No service workers found.');
          } else {
            for (const registration of registrations) {
              await registration.unregister();
              log('Unregistered service worker: ' + registration.scope, 'success');
            }
          }
        } else {
          log('Service workers not supported in this browser.', 'error');
        }
        
        // Clear caches
        if ('caches' in window) {
          log('Clearing caches...');
          const cacheNames = await caches.keys();
          
          if (cacheNames.length === 0) {
            log('No caches found.');
          } else {
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              log('Deleted cache: ' + cacheName, 'success');
            }
          }
        } else {
          log('Cache API not supported in this browser.', 'error');
        }
        
        log('Cache clearing complete! Reloading in 3 seconds...', 'success');
        setTimeout(() => {
          window.location.href = '/?cache_bust=' + Date.now();
        }, 3000);
      } catch (error) {
        log('Error clearing caches: ' + error.message, 'error');
      }
    }

    // Add click handler
    document.getElementById('clearButton').addEventListener('click', clearCaches);
  </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('bolt_adapt/clear-cache.html', htmlContent);

console.log('Cache clearing HTML has been created. To use it:');
console.log('1. Stop any running Vite servers');
console.log('2. Open bolt_adapt/clear-cache.html in your browser');
console.log('3. Click the "Clear All Caches" button');
console.log('4. It will automatically reload to a clean application state\n');

// Try to open the file directly (works on many systems)
const command = process.platform === 'win32' 
  ? 'start'
  : process.platform === 'darwin'
    ? 'open'
    : 'xdg-open';

console.log(`Attempting to open the file with: ${command} bolt_adapt/clear-cache.html`);

import { exec } from 'child_process';

try {
  exec(`${command} bolt_adapt/clear-cache.html`);
} catch (error) {
  console.error('Could not automatically open the file. Please open it manually.');
}
