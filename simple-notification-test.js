import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { config } from 'dotenv';

// Initialize dotenv
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get VAPID keys from .env file
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Set VAPID details for web push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Function to get subscriptions
async function getSubscriptions() {
  console.log('Fetching subscriptions...');
  
  try {
    // Get all subscriptions with the exact fields we know exist
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, endpoint, keys, user_id');
    
    if (error) {
      console.error(`Error fetching subscriptions: ${error.message}`);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No subscriptions found');
      return [];
    }
    
    console.log(`Found ${data.length} subscriptions`);
    
    // Log the first subscription as an example
    if (data.length > 0) {
      console.log('Example subscription:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting subscriptions: ${error.message}`);
    return [];
  }
}

// Function to send a test notification
async function sendTestNotification(subscription) {
  console.log('Preparing to send test notification...');
  
  // Ensure the subscription has the required fields
  if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    console.error('Invalid subscription format. Must include endpoint, p256dh key, and auth key.');
    return { success: false, error: 'Invalid subscription format' };
  }
  
  try {
    console.log(`Sending notification to endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    
    const payload = JSON.stringify({
      title: 'Test Push Notification',
      body: 'This is a test notification sent from the terminal.',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification',
      renotify: true,
      requireInteraction: true
    });
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Notification sent successfully!');
    console.log('Status code:', result.statusCode);
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    console.error('Error sending notification:');
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Body:', error.body);
    return { 
      success: false, 
      statusCode: error.statusCode,
      message: error.message,
      body: error.body
    };
  }
}

// Function to clean up stale subscriptions
async function cleanupStaleSubscription(subscription, error) {
  if (error.statusCode === 410 || error.statusCode === 404) {
    console.log('Subscription is stale, removing from database...');
    
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscription.id);
    
    if (deleteError) {
      console.error('Error deleting stale subscription:', deleteError.message);
    } else {
      console.log('Stale subscription removed successfully');
    }
  }
}

// Main function
async function main() {
  console.log('=== Simple Push Notification Test ===');
  console.log('');
  console.log('VAPID configuration:');
  console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
  console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
  console.log('Subject:', VAPID_SUBJECT);
  console.log('');
  
  // Get subscriptions
  const subscriptions = await getSubscriptions();
  if (subscriptions.length === 0) {
    console.log('No subscriptions to test');
    return;
  }
  
  // Ask user if they want to proceed with testing
  console.log('');
  console.log(`Found ${subscriptions.length} subscriptions. Ready to test notifications.`);
  console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
  
  // Wait for 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Track results
  let successCount = 0;
  let failureCount = 0;
  
  // Send a test notification to each subscription
  for (const subscription of subscriptions) {
    console.log('');
    console.log(`Testing subscription ${subscription.id || 'unknown'}...`);
    
    const result = await sendTestNotification(subscription);
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      
      // Clean up stale subscriptions
      if (result.statusCode === 410 || result.statusCode === 404) {
        await cleanupStaleSubscription(subscription, result);
      }
    }
  }
  
  // Log results
  console.log('');
  console.log('=== Test Results ===');
  console.log(`Successful notifications: ${successCount}`);
  console.log(`Failed notifications: ${failureCount}`);
  
  if (successCount === 0 && failureCount > 0) {
    console.log('');
    console.log('All notifications failed. This could be due to:');
    console.log('1. Stale subscriptions in the database');
    console.log('2. VAPID key mismatch between subscriptions and current keys');
    console.log('3. Browser not being available to receive notifications');
    console.log('');
    console.log('Recommendation:');
    console.log('1. Clear your browser data and service worker');
    console.log('2. Reload the application and allow notifications again');
    console.log('3. Run this test again');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});