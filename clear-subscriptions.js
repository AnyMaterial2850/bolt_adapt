import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Initialize dotenv
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function clearSubscriptions() {
  console.log('=== Clearing Push Subscriptions ===');
  console.log('');
  
  try {
    // First, get all subscriptions to see how many we'll be deleting
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, endpoint');
    
    if (fetchError) {
      console.error(`Error fetching subscriptions: ${fetchError.message}`);
      return;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found to delete');
      return;
    }
    
    console.log(`Found ${subscriptions.length} subscriptions to delete:`);
    subscriptions.forEach(sub => {
      console.log(`- ${sub.id}: ${sub.endpoint.substring(0, 30)}...`);
    });
    
    // Ask for confirmation
    console.log('');
    console.log('WARNING: This will delete ALL push subscriptions from the database.');
    console.log('This means users will need to re-subscribe to notifications.');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
    
    // Wait for 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete all subscriptions
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will delete all rows
    
    if (deleteError) {
      console.error(`Error deleting subscriptions: ${deleteError.message}`);
      return;
    }
    
    console.log('');
    console.log(`Successfully deleted ${subscriptions.length} subscriptions!`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Clear your browser data and service worker cache');
    console.log('2. Reload the application and allow notifications again');
    console.log('3. Test sending a notification');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the function
clearSubscriptions().catch(error => {
  console.error('Unhandled error:', error);
});