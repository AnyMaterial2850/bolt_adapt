import { useDebugStore } from '../stores/debugStore';
import { SW_CACHE_VERSION, addCacheBuster } from './serviceWorkerConfig';

/**
 * Determines the base URL for the application
 * This helps with different deployment environments
 */
function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Registers the service worker with retry capability and enhanced update handling
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
export async function registerServiceWorker(
  maxRetries = 3,
  retryDelay = 2000
): Promise<ServiceWorkerRegistration | null> {
  const { addLog } = useDebugStore.getState();
  
  if (!('serviceWorker' in navigator)) {
    addLog('Service workers are not supported in this browser', 'warn');
    return null;
  }

  let retries = 0;
  
  const attemptRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      // Use a relative path with the base URL to ensure it works in all environments
      // Add cache buster to prevent using cached version of service worker
      const swUrl = addCacheBuster(new URL('/service-worker.js', getBaseUrl()).href);
      
      addLog(`Attempting to register service worker from: ${swUrl}`, 'info', {
        component: 'ServiceWorker',
        data: { version: SW_CACHE_VERSION }
      });
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        // Use 'imports' to ensure the most up-to-date imported scripts are used
        updateViaCache: 'imports'
      });
      
      addLog('Service Worker registered successfully', 'success', {
        component: 'ServiceWorker',
        data: {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
          version: SW_CACHE_VERSION
        }
      });
      
      // Set up update handling
      setupServiceWorkerUpdates(registration);
      
      return registration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Service Worker registration failed: ${errorMessage}`, 'error', {
        component: 'ServiceWorker',
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      // Retry logic
      if (retries < maxRetries) {
        retries++;
        addLog(`Retrying service worker registration (${retries}/${maxRetries})...`, 'warn');
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(attemptRegistration()), retryDelay);
        });
      }
      
      return null;
    }
  };
  
  return attemptRegistration();
}

/**
 * Sets up event listeners for service worker updates and handles them appropriately
 */
function setupServiceWorkerUpdates(registration: ServiceWorkerRegistration): void {
  const { addLog } = useDebugStore.getState();
  
  // Handle new workers that are installing
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    if (!newWorker) return;
    
    addLog('New service worker installing', 'info', {
      component: 'ServiceWorker',
      data: { version: SW_CACHE_VERSION }
    });
    
    // Track state changes
    newWorker.addEventListener('statechange', () => {
      addLog(`Service worker state changed to: ${newWorker.state}`, 'info', {
        component: 'ServiceWorker'
      });
      
      // When the new service worker is installed but waiting
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // A new version is ready but waiting to activate
        addLog('New service worker is waiting to activate', 'info', {
          component: 'ServiceWorker'
        });
        
        // In a real app, you might show a UI notification here
        // allowing the user to refresh the page to get the new version
      }
    });
  });
  
  // Listen for controllerchange events, which happen when a new service worker takes over
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    addLog('New service worker has taken control', 'info', {
      component: 'ServiceWorker'
    });
  });
  
  // Also set up a message handler for communication with the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    const message = event.data;
    
    if (message && message.type === 'SW_VERSION') {
      addLog(`Service worker version: ${message.version}`, 'info', {
        component: 'ServiceWorker'
      });
    }
    
    if (message && message.type === 'CACHE_CLEARED') {
      addLog(`Cache cleared: ${message.cacheName}`, 'success', {
        component: 'ServiceWorker',
        data: message
      });
    }
    
    if (message && message.type === 'ERROR') {
      addLog(`Service worker error: ${message.error}`, 'error', {
        component: 'ServiceWorker',
        data: message
      });
    }
  });
}

/**
 * Checks if there's an update available for the service worker
 * and forces an update if available
 */
export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  const { addLog } = useDebugStore.getState();
  
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      addLog('No service worker registration found', 'warn');
      return false;
    }
    
    addLog('Checking for service worker updates...', 'info');
    
    // Force an update check
    await registration.update();
    
    // Check if a new service worker is waiting or installing
    const hasUpdate = !!registration.installing || !!registration.waiting;
    
    if (hasUpdate) {
      addLog('New service worker version is available', 'success');
      
      // If there's a waiting worker, we can ask it to take control immediately
      if (registration.waiting) {
        // Send a message to the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        addLog('Instructed waiting service worker to activate', 'info');
      }
    } else {
      addLog('Service worker is up to date', 'info');
    }
    
    return hasUpdate;
  } catch (error) {
    addLog('Failed to check for service worker updates', 'error', {
      component: 'ServiceWorker',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return false;
  }
}

/**
 * Manually clears the service worker caches and unregisters the service worker
 * Use this as a recovery mechanism when service worker issues occur
 */
export async function clearServiceWorkerCaches(): Promise<boolean> {
  const { addLog } = useDebugStore.getState();
  
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    addLog('Service worker or Cache API not supported', 'warn');
    return false;
  }
  
  try {
    // Get all cache keys
    const cacheKeys = await caches.keys();
    
    // Delete all caches
    await Promise.all(
      cacheKeys.map(key => {
        addLog(`Deleting cache: ${key}`, 'info');
        return caches.delete(key);
      })
    );
    
    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => {
        addLog(`Unregistering service worker: ${registration.scope}`, 'info');
        return registration.unregister();
      })
    );
    
    addLog('All service worker caches cleared and service workers unregistered', 'success');
    return true;
  } catch (error) {
    addLog('Failed to clear service worker caches', 'error', {
      component: 'ServiceWorker',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return false;
  }
}
