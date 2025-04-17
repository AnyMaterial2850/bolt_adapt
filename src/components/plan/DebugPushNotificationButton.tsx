import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

export function DebugPushNotificationButton() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);

  const sendTestPushNotification = async () => {
    if (!user) {
      alert('User not logged in');
      return;
    }

    setStatus('Sending test push notification...');

    try {
      const response = await fetch('/api/createNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          title: 'Test Push Notification',
          body: 'This is a test push notification sent from the client.',
          data: { test: true }
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`Success: ${result.message}`);
      } else {
        setStatus(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error sending notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <>
      <Button onClick={sendTestPushNotification} variant="outline" size="sm" className="mb-4">
        Send Test Push Notification
      </Button>
      {status && <p className="text-sm mt-2">{status}</p>}
    </>
  );
}
