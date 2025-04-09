import { supabase } from "./supabase";

// Get VAPID key from environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY; 

// Helper function to convert base64 string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
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

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await saveSubscription(subscription);
  } catch (error) {
    console.error("Push subscription error:", error);
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
