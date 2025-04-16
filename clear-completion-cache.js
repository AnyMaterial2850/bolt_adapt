// Script to clear service worker cache specifically for the completionStore
import { createServer } from 'vite';
import fs from 'fs';

// Create a simple HTML page that will clear the cache
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Clear completionStore Cache</title>
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
    .log {
      margin-top: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      height: 200px;
      overflow-y: auto;
    }
    .success {
      color: #4caf50;
    }
    .error {
      color: #f44336;
    }
  </style>
</head>
<body>
  <h1>Clear completionStore Cache</h1>
  <p>
    This utility helps fix issues with the habit completion tracking by clearing any cached versions of the completionStore.
    The following actions will be performed:
  </p>
  <ul>
    <li>Unregister all service workers</li>
    <li>Clear all caches</li>
    <li>Focus on clearing the completionStore.ts file from cache</li>
  </ul>
  
  <button id="clearButton">Clear Cache</button>
  <div class="log" id="log"></div>

  <script>
    const log = document.getElementById('log');
    
    function addLogEntry(message, type = 'info') {
      const entry = document.createElement('div');
      entry.textContent = message;
      if (type === 'success') entry.className = 'success';
      if (type === 'error') entry.className = 'error';
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
    }

    document.getElementById('clearButton').addEventListener('click', async function() {
      addLogEntry('Starting cache clearing process...');
      
      try {
        // 1. Unregister all service workers
        if ('serviceWorker' in navigator) {
          addLogEntry('Unregistering service workers...');
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length === 0) {
            addLogEntry('No service workers found to unregister.');
          }
          
          for (const registration of registrations) {
            await registration.unregister();
            addLogEntry(\`Unregistered service worker: \${registration.scope}\`, 'success');
          }
        } else {
          addLogEntry('Service workers not supported in this browser.', 'error');
        }
        
        // 2. Clear all caches
        if ('caches' in window) {
          addLogEntry('Clearing caches...');
          const cacheNames = await caches.keys();
          
          if (cacheNames.length === 0) {
            addLogEntry('No caches found to clear.');
          }
          
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            addLogEntry(\`Deleted cache: \${cacheName}\`, 'success');
            
            // Check specifically for completion store related caches
            if (cacheName.includes('completion') || cacheName.includes('habit')) {
              addLogEntry(\`✓ Removed habit completion related cache: \${cacheName}\`, 'success');
            }
          }
        } else {
          addLogEntry('Cache API not supported in this browser.', 'error');
        }
        
        // 3. Force reload with cache bypass
        addLogEntry('Cache clearing complete. Reloading application in 5 seconds...', 'success');
        setTimeout(() => {
          addLogEntry('Reloading application with cache bypass...', 'success');
          window.location.href = '/?cache_bust=' + Date.now();
        }, 5000);
      } catch (error) {
        addLogEntry(\`Error during cache clearing: \${error.message}\`, 'error');
      }
    });
  </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('bolt_adapt/clear-completion-cache.html', htmlContent);

async function startServer() {
  console.log('Creating Vite server for cache clearing...');
  
  const server = await createServer({
    configFile: false,
    root: '.',
    server: {
      port: 3002,
      open: '/clear-completion-cache.html',
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx', // Treat .js files as JSX
        },
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /.*\.jsx?$/,
      exclude: [],
    }
  });

  await server.listen();

  console.log('Cache clearing utility is running at:');
  server.printUrls();
  console.log('\nFollow these steps:');
  console.log('1. Click the "Clear Cache" button in the opened browser window');
  console.log('2. The page will reload the application automatically after clearing caches');
  console.log('3. Close this terminal with Ctrl+C when finished');
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
