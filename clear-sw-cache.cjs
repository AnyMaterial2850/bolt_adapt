// Script to clear service worker cache and unregister service workers
console.log('Clearing service worker cache and unregistering service workers...');

// Function to run in the browser
function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator) {
    // Unregister all service workers
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('Service worker unregistered');
        }
      })
      .catch(err => {
        console.error('Error unregistering service worker:', err);
      });

    // Clear all caches
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('All caches cleared successfully');
      })
      .catch(err => {
        console.error('Error clearing caches:', err);
      });
  } else {
    console.log('Service workers not supported in this browser');
  }
}

// Create a simple HTML page to run the script
const html = `
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
    }
    button {
      padding: 10px 15px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    #log {
      margin-top: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <h1>Clear Service Worker Cache</h1>
  <p>Click the button below to clear all service worker caches and unregister service workers.</p>
  <button id="clearButton">Clear Cache & Unregister Service Workers</button>
  <div id="log"></div>

  <script>
    // Override console.log to also display in the log div
    const logDiv = document.getElementById('log');
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = function(message) {
      originalConsoleLog.apply(console, arguments);
      const logMessage = document.createElement('div');
      logMessage.textContent = message;
      logDiv.appendChild(logMessage);
      logDiv.scrollTop = logDiv.scrollHeight;
    };

    console.error = function(message) {
      originalConsoleError.apply(console, arguments);
      const logMessage = document.createElement('div');
      logMessage.textContent = 'ERROR: ' + message;
      logMessage.style.color = 'red';
      logDiv.appendChild(logMessage);
      logDiv.scrollTop = logDiv.scrollHeight;
    };

    // Add click handler to the button
    document.getElementById('clearButton').addEventListener('click', function() {
      console.log('Starting cache clearing process...');
      ${clearServiceWorkerCache.toString()}
      clearServiceWorkerCache();
    });
  </script>
</body>
</html>
`;

// Write the HTML to a file
const fs = require('fs');
fs.writeFileSync('bolt_adapt/clear-sw-cache.html', html);

console.log('Created clear-sw-cache.html. Open this file in a browser to clear the service worker cache.');
console.log('After clearing the cache, restart your application to see the changes.');
