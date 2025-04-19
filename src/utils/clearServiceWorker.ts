/**
 * Utility to unregister all service workers and clear caches
 * This is useful for debugging service worker issues
 */

export async function clearServiceWorkerRegistrations(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return false;
  }

  try {
    console.log('Unregistering all service workers...');
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('No service worker registrations found');
      return true;
    }
    
    await Promise.all(
      registrations.map(async (registration) => {
        const result = await registration.unregister();
        console.log(`Unregistered service worker (scope: ${registration.scope}): ${result ? 'success' : 'failed'}`);
        return result;
      })
    );
    
    console.log('All service workers unregistered');
    return true;
  } catch (error) {
    console.error('Error unregistering service workers:', error);
    return false;
  }
}

export async function clearAllCaches(): Promise<boolean> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported in this browser');
    return false;
  }

  try {
    console.log('Clearing all caches...');
    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      console.log('No caches found');
      return true;
    }
    
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        const result = await caches.delete(cacheName);
        console.log(`Deleted cache ${cacheName}: ${result ? 'success' : 'failed'}`);
        return result;
      })
    );
    
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
}

export async function resetServiceWorker(): Promise<boolean> {
  try {
    const unregistered = await clearServiceWorkerRegistrations();
    const cleared = await clearAllCaches();
    
    if (unregistered && cleared) {
      console.log('Service worker reset complete. Reloading page...');
      // Reload the page to register a fresh service worker
      window.location.reload();
      return true;
    } else {
      console.warn('Service worker reset incomplete');
      return false;
    }
  } catch (error) {
    console.error('Error resetting service worker:', error);
    return false;
  }
}