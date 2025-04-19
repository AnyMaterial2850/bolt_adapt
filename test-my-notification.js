import webpush from 'web-push';
import { config } from 'dotenv';

// Load environment variables
config();

// VAPID keys from .env
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Log VAPID configuration
console.log('VAPID configuration:');
console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
console.log('Subject:', VAPID_SUBJECT);
console.log('');

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Your subscription from the browser console
const subscription = {
  "endpoint": "https://fcm.googleapis.com/fcm/send/fTomH5fuhfs:APA91bHxkz50bnN0Gz6xvMXi_gSYB_AZamWshfSrOJ52vKGyQyVqsrHp_3_WczNDyrPeuCBqaH1W0uNsNVSRlYHPKfqZ5zycewirBF3fzdTcj3vdajOs8GYqcF7L7grkmWetRFsN1e4r",
  "expirationTime": null,
  "keys": {
    "p256dh": "BJB-dxhste0GQ0c9AttVb_KZRqXA7dSOE8sPq4DbBVr_SvHQDNI_zyGApckkE4KA8gZNyGiQ6CdtduFIIXF_nyE",
    "auth": "9PzEdaFlM0sEz4nbwklXUw"
  }
};

// Send notification
async function sendNotification() {
  try {
    console.log('Sending notification to:');
    console.log(`Endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    console.log(`Keys p256dh: ${subscription.keys.p256dh.substring(0, 10)}...`);
    console.log(`Keys auth: ${subscription.keys.auth.substring(0, 5)}...`);
    console.log('');
    
    const payload = JSON.stringify({
      title: 'Terminal Test',
      body: 'This notification was sent directly from the terminal at ' + new Date().toLocaleTimeString(),
      data: { timestamp: new Date().toISOString() },
      tag: 'terminal-test',
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Sending payload:', payload);
    console.log('');
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Success! Status:', result.statusCode);
    console.log('Headers:', result.headers);
  } catch (error) {
    console.error('Error sending notification:');
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Body:', error.body);
    
    if (error.statusCode === 403 && error.body.includes('VAPID credentials')) {
      console.error('\nThis error indicates that the VAPID keys being used to send the notification');
      console.error('do not match the keys that were used when the subscription was created.');
      console.error('\nTo fix this:');
      console.error('1. Clear your browser data and service worker cache');
      console.error('2. Reload the app and allow notifications');
      console.error('3. Get a new subscription and update this script');
    }
    
    if (error.statusCode === 410) {
      console.error('\nThis error indicates that the subscription has expired or been unsubscribed.');
      console.error('You need to get a new subscription from the browser.');
    }
  }
}

// Run the function
sendNotification();