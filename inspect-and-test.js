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

// Function to inspect table structure
async function inspectTable(tableName) {
  console.log(`Inspecting table structure for '${tableName}'...`);
  
  try {
    // Query the information_schema to get column information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Error inspecting table: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`Table '${tableName}' not found or has no columns`);
      return null;
    }
    
    console.log(`Found ${data.length} columns in table '${tableName}':`);
    data.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    return data;
  } catch (error) {
    console.error(`Error inspecting table: ${error.message}`);
    return null;
  }
}

// Function to list all tables
async function listTables() {
  console.log('Listing all tables in the database...');
  
  try {
    // Query the information_schema to get table information
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error(`Error listing tables: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('No tables found in the public schema');
      return null;
    }
    
    console.log(`Found ${data.length} tables in the public schema:`);
    data.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    return data.map(table => table.table_name);
  } catch (error) {
    console.error(`Error listing tables: ${error.message}`);
    return null;
  }
}

// Function to get subscriptions based on table structure
async function getSubscriptions(tableStructure) {
  console.log('Fetching subscriptions...');
  
  try {
    // Get all subscriptions
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

// Main function
async function main() {
  console.log('=== Push Notification Inspection and Test ===');
  console.log('');
  
  // List all tables
  const tables = await listTables();
  if (!tables) {
    console.log('Unable to proceed without table information');
    return;
  }
  
  // Check if subscriptions table exists
  if (!tables.includes('subscriptions')) {
    console.log('No subscriptions table found in the database');
    return;
  }
  
  // Inspect the subscriptions table
  const tableStructure = await inspectTable('subscriptions');
  if (!tableStructure) {
    console.log('Unable to proceed without table structure');
    return;
  }
  
  // Get subscriptions based on the table structure
  const subscriptions = await getSubscriptions(tableStructure);
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
    }
  }
  
  // Log results
  console.log('');
  console.log('=== Test Results ===');
  console.log(`Successful notifications: ${successCount}`);
  console.log(`Failed notifications: ${failureCount}`);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});