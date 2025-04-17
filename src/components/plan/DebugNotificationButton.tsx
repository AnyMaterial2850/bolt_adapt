import { useState } from 'react';
import { Button } from '../ui/Button';

export function DebugNotificationButton() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = async () => {
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  };

  const triggerNotification = async () => {
    const perm = await requestPermission();
    if (perm !== 'granted') {
      alert('Notification permission not granted');
      return;
    }

    try {
      // Use service worker registration to show notification for better integration
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification('Test Notification', {
          body: 'This is a test notification from the Plan page.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          requireInteraction: false,
        });
      } else {
        // Fallback to direct Notification API if no service worker registration found
        new Notification('Test Notification', {
          body: 'This is a test notification from the Plan page.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          requireInteraction: false,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      alert('Failed to show notification. See console for details.');
    }
  };

  return (
    <Button onClick={triggerNotification} variant="outline" size="sm" className="mb-4">
      Trigger Test Notification
    </Button>
  );
}
