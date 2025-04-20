import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// The new subscription from the user
const subscription = {
  "endpoint": "https://fcm.googleapis.com/fcm/send/e2M_VOOrCUI:APA91bHH-gknZydABKd9PBXqS2k1OV7z6pIPIMxeIW8IyNGKQ1p2wIyoEv2isr4eJJRgewEsq9VwL63MAD65nk41NvQ6reODhnDQGYPrWljCxFcKJ0pbRrle7SDTS5-iD70fidyKtAfZ",
  "expirationTime": null,
  "keys": {
    "p256dh": "BAGx0XCRZjYVyt_PYiD1Ufw2eMc9F92t-GeaUgPcayoZDz4aIJBpvxWKrIGk-kFAgzlycIFOK8OnaJ5CXHtTGR8",
    "auth": "suzFQS-Coi3oUzJboB7eRA"
  }
};

// Function to save subscription to database
async function saveSubscription() {
  console.log('=== Saving Subscription to Database ===');
  
  try {
    // Get the user ID from the command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.error('Usage: node save-subscription.js <user_id>');
      process.exit(1);
    }
    
    console.log(`Saving subscription for user ID: ${userId}`);
    console.log(`Endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    
    // Insert the subscription into the database
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          user_id: userId
        },
        {
          onConflict: 'endpoint',
          ignoreDuplicates: false
        }
      )
      .select();
    
    if (error) {
      console.error(`Error saving subscription: ${error.message}`);
      process.exit(1);
    }
    
    console.log('Subscription saved successfully!');
    console.log('Subscription ID:', data[0].id);
    
    // Verify the subscription was saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('endpoint', subscription.endpoint);
    
    if (verifyError) {
      console.error(`Error verifying subscription: ${verifyError.message}`);
    } else if (verifyData && verifyData.length > 0) {
      console.log('Verified subscription in database:');
      console.log(`ID: ${verifyData[0].id}`);
      console.log(`User ID: ${verifyData[0].user_id}`);
      console.log(`Endpoint: ${verifyData[0].endpoint.substring(0, 30)}...`);
    } else {
      console.error('Subscription was not found in the database after saving!');
    }
    
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run the function
saveSubscription();