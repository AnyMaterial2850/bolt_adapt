import webpush from 'web-push';
import { config } from 'dotenv';

// Load environment variables
config();

// VAPID keys from .env
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Helper function to convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = Buffer.from(base64, 'base64');
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// The subscription from the user's browser
// We'll use the one from the test-new-subscription.js script that worked
const subscription = {
  "endpoint": "https://fcm.googleapis.com/fcm/send/e2M_VOOrCUI:APA91bHH-gknZydABKd9PBXqS2k1OV7z6pIPIMxeIW8IyNGKQ1p2wIyoEv2isr4eJJRgewEsq9VwL63MAD65nk41NvQ6reODhnDQGYPrWljCxFcKJ0pbRrle7SDTS5-iD70fidyKtAfZ",
  "expirationTime": null,
  "keys": {
    "p256dh": "BAGx0XCRZjYVyt_PYiD1Ufw2eMc9F92t-GeaUgPcayoZDz4aIJBpvxWKrIGk-kFAgzlycIFOK8OnaJ5CXHtTGR8",
    "auth": "suzFQS-Coi3oUzJboB7eRA"
  }
};

// Send a debug notification with a unique identifier
async function sendDebugNotification() {
  try {
    // Generate a unique ID for this notification
    const notificationId = Math.random().toString(36).substring(2, 15);
    
    console.log(`Sending debug notification with ID: ${notificationId}`);
    console.log(`To endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    
    const payload = JSON.stringify({
      title: 'Debug Notification',
      body: `This is a debug notification with ID: ${notificationId}`,
      data: { 
        debugId: notificationId,
        timestamp: new Date().toISOString(),
        test: true
      },
      tag: `debug-${notificationId}`,
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Payload:', payload);
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Success! Status:', result.statusCode);
    
    console.log('\nIf you do not see this notification on your computer:');
    console.log('1. Check your browser\'s notification settings');
    console.log('   - Chrome: chrome://settings/content/notifications');
    console.log('   - Firefox: about:preferences#privacy > Permissions > Notifications');
    console.log('2. Check your operating system\'s notification settings');
    console.log('   - Windows: Settings > System > Notifications & actions');
    console.log('   - macOS: System Preferences > Notifications');
    console.log('3. Make sure your browser is not in Do Not Disturb mode');
    console.log('4. Try restarting your browser');
    
    return { success: true, notificationId };
  } catch (error) {
    console.error('Error sending notification:');
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Body:', error.body);
    return { success: false, error };
  }
}

// Send multiple debug notifications with increasing delays
async function sendMultipleNotifications(count = 5, initialDelay = 2000) {
  console.log(`=== Sending ${count} debug notifications with increasing delays ===\n`);
  
  for (let i = 0; i < count; i++) {
    const delay = initialDelay + (i * 2000); // Increase delay by 2 seconds for each notification
    console.log(`\nSending notification ${i + 1}/${count} after ${delay/1000} seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await sendDebugNotification();
  }
  
  console.log('\n=== All notifications sent ===');
  console.log('If you still don\'t see any notifications, please check the browser console for any errors.');
  console.log('Open the browser\'s developer tools (F12) and look for errors in the Console tab.');
}

// Run the function
sendMultipleNotifications().catch(error => {
  console.error('Unhandled error:', error);
});