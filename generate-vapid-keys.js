import webpush from 'web-push';
import fs from 'fs/promises';
import path from 'path';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated new VAPID keys:');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);

// Update .env file with new VAPID keys
async function updateEnvFile() {
  try {
    const envPath = path.resolve('.env');
    let envContent = await fs.readFile(envPath, 'utf8');
    
    // Replace or add VAPID keys
    envContent = envContent.replace(/VITE_VAPID_PUBLIC_KEY=.*/g, `VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    envContent = envContent.replace(/SUPABASE_VAPID_PUBLIC_KEY=.*/g, `SUPABASE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    envContent = envContent.replace(/SUPABASE_VAPID_PRIVATE_KEY=.*/g, `SUPABASE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    
    // If keys don't exist, add them
    if (!envContent.includes('VITE_VAPID_PUBLIC_KEY=')) {
      envContent += `\nVITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    if (!envContent.includes('SUPABASE_VAPID_PUBLIC_KEY=')) {
      envContent += `\nSUPABASE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    if (!envContent.includes('SUPABASE_VAPID_PRIVATE_KEY=')) {
      envContent += `\nSUPABASE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    }
    
    await fs.writeFile(envPath, envContent);
    console.log('.env file updated with new VAPID keys');
    
    // Create instructions for next steps
    console.log('\nNext steps:');
    console.log('1. Deploy the application with the new VAPID keys:');
    console.log('   ./scripts/deploy-all.sh');
    console.log('2. Clear your browser\'s service worker and cache:');
    console.log('   - Open Chrome DevTools');
    console.log('   - Go to Application tab');
    console.log('   - Select "Clear site data"');
    console.log('3. Reload the application and allow notifications again');
    console.log('4. Test sending a notification');
    
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Run the update
updateEnvFile();