import webpush from 'web-push';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
config();

// VAPID keys from .env file
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Set VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Function to send a test notification
async function sendTestNotification(subscription) {
  try {
    console.log('Sending test notification...');
    console.log('Subscription:', JSON.stringify(subscription, null, 2));
    
    const payload = JSON.stringify({
      title: 'Test Push Notification',
      body: 'This is a test push notification sent from the terminal.',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification',
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Payload:', payload);
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Notification sent successfully!');
    console.log('Status code:', result.statusCode);
    console.log('Headers:', result.headers);
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

// Main function
async function main() {
  // Check if subscription is provided as command line argument
  if (process.argv.length < 3) {
    console.error('Usage: node test-push-notification.js \'{"endpoint":"...","keys":{"p256dh":"...","auth":"..."}}\'');
    process.exit(1);
  }
  
  try {
    // Parse subscription from command line argument
    const subscription = JSON.parse(process.argv[2]);
    
    // Validate subscription
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('Invalid subscription format. Must include endpoint, p256dh key, and auth key.');
      process.exit(1);
    }
    
    // Log VAPID configuration
    console.log('VAPID configuration:');
    console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
    console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
    console.log('Subject:', VAPID_SUBJECT);
    
    // Send test notification
    await sendTestNotification(subscription);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();