import webpush from 'web-push';
import fs from 'fs/promises';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== Fix VAPID Keys ===');
  console.log('');
  
  // Step 1: Generate new VAPID keys
  console.log('Generating new VAPID keys...');
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('New VAPID keys generated:');
  console.log(`Public key: ${vapidKeys.publicKey.substring(0, 10)}...`);
  console.log(`Private key: ${vapidKeys.privateKey.substring(0, 5)}...`);
  console.log('');
  
  // Step 2: Clear all existing subscriptions
  console.log('Clearing all existing subscriptions...');
  try {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error(`Error clearing subscriptions: ${error.message}`);
    } else {
      console.log('All subscriptions cleared successfully');
    }
  } catch (error) {
    console.error(`Error clearing subscriptions: ${error.message}`);
  }
  
  // Step 3: Update .env file with new VAPID keys
  console.log('');
  console.log('Updating .env file with new VAPID keys...');
  try {
    // Read the current .env file
    const envContent = await fs.readFile('.env', 'utf8');
    
    // Replace the VAPID keys
    let updatedContent = envContent
      .replace(/^VITE_VAPID_PUBLIC_KEY=.*/m, `VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
      .replace(/^SUPABASE_VAPID_PUBLIC_KEY=.*/m, `SUPABASE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
      .replace(/^SUPABASE_VAPID_PRIVATE_KEY=.*/m, `SUPABASE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    
    // Add VAPID keys if they don't exist
    if (!envContent.includes('VITE_VAPID_PUBLIC_KEY=')) {
      updatedContent += `\nVITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    if (!envContent.includes('SUPABASE_VAPID_PUBLIC_KEY=')) {
      updatedContent += `\nSUPABASE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    if (!envContent.includes('SUPABASE_VAPID_PRIVATE_KEY=')) {
      updatedContent += `\nSUPABASE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    }
    
    // Write the updated content back to the .env file
    await fs.writeFile('.env', updatedContent);
    console.log('.env file updated successfully');
  } catch (error) {
    console.error(`Error updating .env file: ${error.message}`);
  }
  
  // Step 4: Provide instructions for next steps
  console.log('');
  console.log('=== Next Steps ===');
  console.log('1. Restart your development server to load the new environment variables');
  console.log('2. Clear your browser data and service worker cache:');
  console.log('   - Open Chrome DevTools (F12)');
  console.log('   - Go to Application tab');
  console.log('   - Select "Clear site data" under Storage');
  console.log('3. Reload the application and allow notifications when prompted');
  console.log('4. Test sending a notification using the "Send Test Push Notification" button');
  console.log('');
  console.log('The notification system should now work properly!');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});