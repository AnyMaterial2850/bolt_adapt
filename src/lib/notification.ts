import { supabase } from "./supabase";

// Get VAPID key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY; 

// Helper function to convert base64 string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string) {
  // Remove all whitespace and newlines
  base64String = base64String.replace(/\s+/g, '');
  // Replace non-url compatible chars with base64 standard chars
  base64String = base64String.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' characters to make length a multiple of 4
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = base64String + padding;

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications if possible
 * This is optional and will gracefully degrade if VAPID key is missing
 */
const subscribeToPushNotifications = async () => {
  // Check if service workers are supported
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers not supported in this browser");
    return;
  }

  // Check if VAPID key is available
  if (!VAPID_PUBLIC_KEY) {
    console.warn("VAPID_PUBLIC_KEY is missing - push notifications will be disabled");
    // Return a resolved promise to allow the app to continue
    return Promise.resolve();
  }

function cleanVapidKey(key: string): string {
  // Remove whitespace, padding, and normalize
  return key.trim().replace(/=+$/, '').replace(/\s+/g, '');
}

function logVapidKeyInfo(key: string) {
  console.log('VAPID key raw length:', key.length);
  console.log('VAPID key:', key);
  try {
    const decoded = urlBase64ToUint8Array(key);
    console.log('VAPID key decoded length:', decoded.length);
  } catch (e) {
    console.error('Error decoding VAPID key:', e);
  }
}

const cleanedVapidKey = cleanVapidKey(VAPID_PUBLIC_KEY);
logVapidKeyInfo(cleanedVapidKey);

function isValidVapidKey(key: string): boolean {
  try {
    const decoded = urlBase64ToUint8Array(key);
    return decoded.length === 65;
  } catch {
    return false;
  }
}

if (!isValidVapidKey(cleanedVapidKey)) {
  console.error('Invalid VAPID public key length or format.');
  return;
}

    try {
      // Use existing registration if available
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('No existing service worker registration found, registering new one...');
        registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log('Service worker registered:', registration);
      } else {
        console.log('Existing service worker registration found:', registration);
      }

      console.log("Service worker registration state:", {
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active,
        scope: registration.scope,
      });

      // Wait for service worker to be active
      if (registration.installing) {
        await new Promise((resolve, reject) => {
          registration.installing?.addEventListener('statechange', (event) => {
            console.log('Service worker installing state changed:', (event.target as ServiceWorker).state);
            if ((event.target as ServiceWorker).state === 'activated') {
              resolve(true);
            }
          });
        });
      } else if (registration.waiting) {
        await new Promise((resolve) => {
          registration.waiting?.addEventListener('statechange', (event) => {
            console.log('Service worker waiting state changed:', (event.target as ServiceWorker).state);
            if ((event.target as ServiceWorker).state === 'activated') {
              resolve(true);
            }
          });
        });
      } else if (registration.active) {
        console.log('Service worker already active');
      } else {
        // No active service worker, wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    // Clear any existing push subscriptions to avoid conflicts
    // Consider removing this to avoid unnecessary unsubscribe on every subscription attempt
    // const existingSubscription = await registration.pushManager.getSubscription();
    // if (existingSubscription) {
    //   await existingSubscription.unsubscribe();
    //   console.log("Existing push subscription unsubscribed");
    // }

    // Clear all caches to avoid stale service worker issues
    // Consider removing this to avoid clearing caches on every subscription attempt
    // const cacheNames = await caches.keys();
    // await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    // console.log("All caches cleared");

    // Retry push subscription with exponential backoff
    const maxRetries = 5;
    let attempt = 0;
    let subscription = null;
    while (attempt < maxRetries) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cleanedVapidKey),
        });
        break; // Success
      } catch (err) {
        console.error(`Push subscription attempt ${attempt + 1} failed:`, err);
        attempt++;
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!subscription) {
      throw new Error("Failed to subscribe to push notifications after multiple attempts");
    }

    await saveSubscription(subscription);
  } catch (error) {
    console.error("Push subscription error:", error);
    if (error) {
      if (typeof error === 'object') {
        console.error("Error name:", (error as any).name);
        console.error("Error message:", (error as any).message);
        if ((error as any).stack) {
          console.error("Error stack:", (error as any).stack);
        }
      } else {
        console.error("Error details:", error);
      }
    }
  }
};

const saveSubscription = async (subscription: PushSubscription) => {
  console.log({subscription});
  try {
    // Get the currently authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Check if user retrieval failed
    if (userError) {
      console.error("Error getting authenticated user:", userError.message);
      return { success: false, error: userError };
    }
    
    // Verify user is logged in
    if (!user) {
      const error = new Error("No authenticated user found. Please log in to enable notifications.");
      console.error(error.message);
      return { success: false, error };
    }
    
    // Extract keys from the subscription
    const subscriptionKeys = subscription.toJSON().keys;
    
    // Attempt to insert or update the subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(
        { 
          endpoint: subscription.endpoint, 
          keys: subscriptionKeys, 
          user_id: user.id 
        },
        { 
          onConflict: 'endpoint',  // Handle conflicts based on endpoint
          ignoreDuplicates: false  // Update existing records rather than ignoring
        }
      )
      .select();
    
    // Handle database operation errors
    if (error) {
      console.error("Error saving subscription:", error.message);
      return { success: false, error };
    }
    
    console.log("Subscription saved successfully:", data);
    return { success: true, data };
    
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error saving subscription:", error);
    return { success: false, error };
  }
};

/**
 * Request notification permission from the user
 * Will attempt to subscribe to push notifications if permission is granted
 * If VAPID key is missing, it will still request permission but won't set up push
 */
const requestNotificationPermission = async () => {
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      // Even if subscribeToPushNotifications fails, we still want to return success
      // since the basic notification permission was granted
      await subscribeToPushNotifications();
      return Promise.resolve();
    }
    throw new Error("Notifications permission denied. Please enable notifications to receive reminders.");
  } catch (error: unknown) {
    console.warn("Error requesting notification permission:", error);
    throw error;
  }
};

export { urlBase64ToUint8Array, subscribeToPushNotifications, requestNotificationPermission };
