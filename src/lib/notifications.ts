import { supabase } from './supabase';
import { useDebugStore } from '../stores/debugStore';

// Check if the browser supports notifications
export function checkNotificationSupport() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const { addLog } = useDebugStore.getState();
  
  if (!checkNotificationSupport()) {
    addLog('Notifications not supported', 'error');
    throw new Error('Notifications not supported');
  }

  try {
    addLog('Requesting notification permission...', 'info');
    const permission = await Notification.requestPermission();
    addLog(`Notification permission: ${permission}`, 'info');
    return permission;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to request notification permission';
    addLog(message, 'error');
    throw err;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  const { addLog } = useDebugStore.getState();

  try {
    addLog('Subscribing to push notifications...', 'info');
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If no subscription exists, create one
    if (!subscription) {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      // Convert VAPID key to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Store subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: supabase.auth.user()?.id,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    addLog('Successfully subscribed to push notifications', 'success');
    return subscription;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
    addLog(message, 'error');
    throw err;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications() {
  const { addLog } = useDebugStore.getState();

  try {
    addLog('Unsubscribing from push notifications...', 'info');
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    const subscription = await registration.pushManager.getSubscription();
    
    // If subscription exists, unsubscribe
    if (subscription) {
      await subscription.unsubscribe();
      
      // Remove subscription from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .match({ subscription: subscription.toJSON() });

      if (error) throw error;
    }

    addLog('Successfully unsubscribed from push notifications', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
    addLog(message, 'error');
    throw err;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Show a notification
export function showNotification(title: string, options?: NotificationOptions) {
  const { addLog } = useDebugStore.getState();

  if (!checkNotificationSupport()) {
    addLog('Notifications not supported', 'error');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        badge: '/pwa-192x192.png',
        icon: '/pwa-192x192.png',
        ...options
      });

      notification.onclick = function() {
        window.focus();
        notification.close();
      };

      addLog(`Showed notification: ${title}`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to show notification';
      addLog(message, 'error');
    }
  }
}