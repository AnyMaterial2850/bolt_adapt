import webpush from 'web-push';
import fs from 'fs/promises';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== Synchronizing VAPID Keys Across Environments ===');
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
  
  // Step 4: Update .env.production file with new VAPID keys
  console.log('');
  console.log('Updating .env.production file with new VAPID keys...');
  try {
    // Read the current .env.production file
    let envProdContent = '';
    try {
      envProdContent = await fs.readFile('.env.production', 'utf8');
    } catch (readError) {
      console.log('.env.production file not found, creating a new one');
      envProdContent = '';
    }
    
    // Replace the VAPID keys
    let updatedContent = envProdContent
      .replace(/^VITE_VAPID_PUBLIC_KEY=.*/gm, `VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
      .replace(/^VITE_VAPID_PRIVATE_KEY=.*/gm, `VITE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    
    // Add VAPID keys if they don't exist
    if (!updatedContent.includes('VITE_VAPID_PUBLIC_KEY=')) {
      updatedContent += `\nVITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    if (!updatedContent.includes('VITE_VAPID_PRIVATE_KEY=')) {
      updatedContent += `\nVITE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    }
    
    // Write the updated content back to the .env.production file
    await fs.writeFile('.env.production', updatedContent);
    console.log('.env.production file updated successfully');
  } catch (error) {
    console.error(`Error updating .env.production file: ${error.message}`);
  }
  
  // Step 5: Provide instructions for updating Vercel environment variables
  console.log('');
  console.log('=== Next Steps ===');
  console.log('1. Update the VAPID keys in the Vercel dashboard:');
  console.log('   - Go to https://vercel.com/adaptjourneyteam/adapt/settings/environment-variables');
  console.log('   - Update VITE_VAPID_PUBLIC_KEY with:');
  console.log(`     ${vapidKeys.publicKey}`);
  console.log('   - Update SUPABASE_VAPID_PUBLIC_KEY with:');
  console.log(`     ${vapidKeys.publicKey}`);
  console.log('   - Update SUPABASE_VAPID_PRIVATE_KEY with:');
  console.log(`     ${vapidKeys.privateKey}`);
  console.log('2. Redeploy the application using: ./scripts/deploy-all.sh');
  console.log('3. Clear your browser data and service worker cache on all devices');
  console.log('4. Test the notifications on all devices');
  console.log('');
  console.log('The notification system should now work properly across all devices!');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});