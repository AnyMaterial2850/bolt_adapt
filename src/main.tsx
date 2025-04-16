import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/phone-input.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker, checkForServiceWorkerUpdate } from './lib/sw-reg.ts';
import { useDebugStore } from './stores/debugStore';

// Initialize service worker with better error handling
(async () => {
  const { addLog } = useDebugStore.getState();
  
  try {
    addLog('Initializing application', 'info');
    
    // Register service worker
    const registration = await registerServiceWorker();
    
    if (registration) {
      addLog('Service worker registered successfully', 'success');
      
      // Set up periodic checks for service worker updates
      // Check for updates every 30 minutes
      setInterval(async () => {
        const hasUpdate = await checkForServiceWorkerUpdate();
        if (hasUpdate) {
          addLog('Service worker update available', 'info');
        }
      }, 30 * 60 * 1000);
    } else {
      addLog('Service worker registration failed or not supported', 'warn');
    }
  } catch (error) {
    addLog('Error during application initialization', 'error', {
      component: 'main',
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
})();

// Render the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
