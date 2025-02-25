import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY; 
console.log({VAPID_PUBLIC_KEY});

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
  }



const subscribeToPushNotifications = async () => {
if (!("serviceWorker" in navigator)) return;
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

const requestNotificationPermission = async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") {
        return subscribeToPushNotifications();
    }
    throw new Error("Notifications permission denied. Please enable notifications to receive reminders.");
};

export { urlBase64ToUint8Array , subscribeToPushNotifications, requestNotificationPermission};