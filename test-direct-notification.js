import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// VAPID keys from .env
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || process.env.SUPABASE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function getSubscriptions(userId) {
  console.log(`Getting subscriptions for user ID: ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching subscriptions: ${error.message}`);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No subscriptions found for user');
      return [];
    }
    
    console.log(`Found ${data.length} subscriptions`);
    return data;
  } catch (error) {
    console.error(`Error getting subscriptions: ${error.message}`);
    return [];
  }
}

async function sendNotification(subscription) {
  try {
    console.log('Sending notification to:');
    console.log(`Endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    console.log(`Keys p256dh: ${subscription.keys.p256dh.substring(0, 10)}...`);
    console.log(`Keys auth: ${subscription.keys.auth.substring(0, 5)}...`);
    console.log('');
    
    const payload = JSON.stringify({
      title: 'Direct Test',
      body: `This notification was sent directly from the terminal at ${new Date().toLocaleTimeString()}`,
      data: { 
        timestamp: new Date().toISOString(),
        test: true
      },
      tag: 'direct-test',
      renotify: true,
      requireInteraction: true
    });
    
    console.log('Sending payload:', payload);
    console.log('');
    
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Success! Status:', result.statusCode);
    console.log('Headers:', result.headers);
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    console.error('Error sending notification:');
    console.error('Status code:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Body:', error.body);
    
    if (error.statusCode === 403 && error.body.includes('VAPID credentials')) {
      console.error('\nThis error indicates that the VAPID keys being used to send the notification');
      console.error('do not match the keys that were used when the subscription was created.');
    }
    
    if (error.statusCode === 410) {
      console.error('\nThis error indicates that the subscription has expired or been unsubscribed.');
      console.error('Removing stale subscription from database...');
      
      try {
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id);
        
        if (deleteError) {
          console.error(`Error deleting subscription: ${deleteError.message}`);
        } else {
          console.log('Stale subscription removed successfully');
        }
      } catch (deleteError) {
        console.error(`Error deleting subscription: ${deleteError.message}`);
      }
    }
    
    return { success: false, statusCode: error.statusCode, message: error.message };
  }
}

async function main() {
  try {
    // Get the user ID from the command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.error('Usage: node test-direct-notification.js <user_id>');
      process.exit(1);
    }
    
    console.log('=== Testing Direct Notification ===');
    console.log('VAPID configuration:');
    console.log('Public key:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 10)}...` : 'Not set');
    console.log('Private key:', VAPID_PRIVATE_KEY ? `${VAPID_PRIVATE_KEY.substring(0, 5)}...` : 'Not set');
    console.log('Subject:', VAPID_SUBJECT);
    console.log('');
    
    // Get subscriptions for the user
    const subscriptions = await getSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.error('No subscriptions found for user');
      process.exit(1);
    }
    
    // Send notifications to all subscriptions
    let successCount = 0;
    let failureCount = 0;
    
    for (const subscription of subscriptions) {
      console.log(`Testing subscription ${subscription.id}...`);
      const result = await sendNotification(subscription);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      console.log('');
    }
    
    console.log('=== Test Results ===');
    console.log(`Successful notifications: ${successCount}`);
    console.log(`Failed notifications: ${failureCount}`);
    
  } catch (error) {
    console.error(`Main error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();