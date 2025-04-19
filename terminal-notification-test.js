import webpush from 'web-push';
import { config } from 'dotenv';
import fs from 'fs/promises';

// Initialize dotenv
config();

// Get VAPID keys from .env file
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Log VAPID configuration
console.log('VAPID configuration:');
console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
console.log('Subject:', VAPID_SUBJECT);

// Set VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Hardcoded subscription from the logs
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/fZkAPsWyul0:APA91bEGQnFl_fvr22ErYGH3Y_IAFBAQuf0ClS68vz776iPE4YswLrIChmTsO9YbRbMMCjX582r_JHwkW0X_jc74SvTbFpeVj649zepAq1a6NULDalMYZ2LnbXZ6P0jWwBzk7eN3qzxJ",
  keys: {
    p256dh: "BPcJy2lWEoCs3m1rqhZUBMcwjj26SON2NnsKG93X2a3_AFnQ7bBg6_8KXV_6hdY8U5yY9zB4tD6mE6-utGq7R6s",
    auth: "scL7GlQ52FrWMauxVZ9jog"
  }
};

// Function to send a test notification
async function sendTestNotification() {
  try {
    console.log('Sending test notification...');
    console.log('Subscription:', JSON.stringify(subscription, null, 2));
    
    const payload = JSON.stringify({
      title: 'Terminal Test Notification',
      body: 'This is a test notification sent directly from the terminal.',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'terminal-test',
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Payload:', payload);
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Notification sent successfully!');
    console.log('Status code:', result.statusCode);
    return result;
  } catch (error) {
    console.error('Error sending notification:');
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Body:', error.body);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Run the test
sendTestNotification()
  .then(() => {
    console.log('Test completed successfully!');
    
    // Check if the browser is focused
    console.log('\nIMPORTANT: If you don\'t see the notification:');
    console.log('1. Make sure your browser is NOT in focus (click away from the browser)');
    console.log('2. Check your system notification settings');
    console.log('3. Look for any errors in the browser console');
  })
  .catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
  });