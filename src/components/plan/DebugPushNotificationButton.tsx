import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { requestNotificationPermission } from '../../lib/notification';
import { resetServiceWorker } from '../../utils/clearServiceWorker';

export function DebugPushNotificationButton() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const sendTestPushNotification = async () => {
    if (!user) {
      alert('User not logged in');
      return;
    }

    // Clear previous logs
    setLogs([]);
    setStatus('Sending test push notification...');

    try {
      addLog('Requesting notification permission...');
      setStatus('Requesting notification permission...');
      await requestNotificationPermission();
      addLog('Notification permission granted and subscription attempted');
      setStatus('Sending test push notification...');
      
      // Debug: check service worker registration and subscription
      addLog('Checking service worker registration and subscription...');
      const registration = await navigator.serviceWorker.getRegistration();
      addLog(`Service worker registration: ${registration ? 'Found' : 'Not found'}`);
      
      if (registration) {
        addLog(`Service worker state: ${registration.active ? 'active' : registration.installing ? 'installing' : registration.waiting ? 'waiting' : 'unknown'}`);
      }
      
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      addLog(`Push subscription: ${subscription ? 'Found' : 'Not found'}`);
      
      if (subscription) {
        addLog(`Subscription endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        addLog(`Subscription expiration time: ${subscription.expirationTime || 'none'}`);
      }
      
      setStatus(`Subscription endpoint: ${subscription?.endpoint ? subscription.endpoint.substring(0, 30) + '...' : 'none'}`);
      
      // Get the current session and access token
      addLog('Getting Supabase session...');
      const { data: { session }, error: sessionError } = await import('../../lib/supabase').then(m => m.supabase.auth.getSession());
      if (sessionError || !session) {
        const errorMsg = 'No Supabase session or error: ' + (sessionError?.message || 'Not logged in');
        addLog(errorMsg);
        setStatus('Error: No Supabase session or not logged in');
        return;
      }
      const accessToken = session.access_token;
      addLog('Supabase session obtained successfully');

      // Send a single test notification
      addLog(`Sending test notification...`);
      
      const response = await fetch('/api/createNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          title: `Test Push Notification`,
          body: `This is a test push notification sent from the client.`,
          data: { test: true }
        })
      });

      const result = await response.json();
      addLog(`Notification response received: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        addLog(`Notification success: ${result.message}`);
        setStatus(`Success: ${result.message}`);
      } else {
        addLog(`Notification error: ${result.error || 'Unknown error'}`);
        setStatus(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = `Error sending notification: ${error instanceof Error ? error.message : String(error)}`;
      addLog(errorMsg);
      setStatus(errorMsg);
    }
  };

  const handleResetServiceWorker = async () => {
    addLog('Resetting service worker...');
    try {
      await resetServiceWorker();
      addLog('Service worker reset initiated. Page will reload.');
    } catch (error) {
      addLog(`Error resetting service worker: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={sendTestPushNotification} variant="outline" size="sm">
          Send Test Push Notification
        </Button>
        <Button onClick={handleResetServiceWorker} variant="outline" size="sm" className="bg-red-50 hover:bg-red-100">
          Reset Service Worker
        </Button>
      </div>
      {status && <p className="text-sm font-medium">{status}</p>}
      
      {logs.length > 0 && (
        <div className="mt-4 border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-medium mb-2">Debug Logs:</h3>
          <div className="space-y-1">
            {logs.map((log, index) => (
              <p key={index} className="text-xs font-mono whitespace-pre-wrap">{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
