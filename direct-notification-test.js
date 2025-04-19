import webpush from 'web-push';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get VAPID keys from .env file
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Log configuration
console.log('=== Direct Notification Test ===');
console.log('This script tests push notifications using subscriptions from the database');
console.log('');
console.log('Supabase URL:', SUPABASE_URL);
console.log('VAPID configuration:');
console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
console.log('Subject:', VAPID_SUBJECT);
console.log('');

// Set VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Function to get subscriptions from the database
async function getSubscriptions() {
  try {
    // Get all subscriptions without ordering by created_at
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching subscriptions: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('No subscriptions found in the database');
      return [];
    }
    
    console.log(`Found ${data.length} subscriptions in the database`);
    
    // Return the subscriptions
    return data;
  } catch (error) {
    console.error('Error getting subscriptions:', error.message);
    return [];
  }
}

// Function to send a test notification
async function sendTestNotification(subscription) {
  try {
    console.log('Sending test notification...');
    console.log('Subscription:', JSON.stringify(subscription, null, 2));
    
    const payload = JSON.stringify({
      title: 'Database Test Notification',
      body: 'This is a test notification sent using a subscription from the database.',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'database-test',
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Payload:', payload);
    
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
async function cleanupStaleSubscriptions(subscription, error) {
  if (error.statusCode === 410 || error.statusCode === 404) {
    console.log('Subscription is stale, removing from database...');
    
    // Check if the subscription has an id field
    const idField = subscription.id ? 'id' : 'endpoint';
    const idValue = subscription.id || subscription.endpoint;
    
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq(idField, idValue);
    
    if (deleteError) {
      console.error('Error deleting stale subscription:', deleteError.message);
    } else {
      console.log('Stale subscription removed successfully');
    }
  }
}

// Main function
async function main() {
  try {
    // Get subscriptions from the database
    const subscriptions = await getSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log('No subscriptions to test');
      return;
    }
    
    // Track results
    let successCount = 0;
    let failureCount = 0;
    
    // Send a test notification to each subscription
    for (const subscription of subscriptions) {
      console.log(`Testing subscription ${subscription.id}...`);
      
      const result = await sendTestNotification(subscription);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        
        // Clean up stale subscriptions
        if (result.statusCode === 410 || result.statusCode === 404) {
          await cleanupStaleSubscriptions(subscription, result);
        }
      }
      
      console.log('');
    }
    
    // Log results
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
  } catch (error) {
    console.error('Error in main function:', error.message);
  }
}

// Run the main function
main();