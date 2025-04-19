import fs from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables from .env
config();

async function main() {
  console.log('=== Updating .env.production with new VAPID keys ===');
  
  // Get VAPID keys from .env
  const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.SUPABASE_VAPID_PRIVATE_KEY;
  
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not found in .env file');
    process.exit(1);
  }
  
  console.log('VAPID keys from .env:');
  console.log(`Public key: ${VAPID_PUBLIC_KEY.substring(0, 10)}...`);
  console.log(`Private key: ${VAPID_PRIVATE_KEY.substring(0, 5)}...`);
  
  try {
    // Read the current .env.production file
    const envProdContent = await fs.readFile('.env.production', 'utf8');
    
    // Replace the VAPID keys
    let updatedContent = envProdContent
      .replace(/^VITE_VAPID_PUBLIC_KEY=.*/gm, `VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`)
      .replace(/^VITE_VAPID_PRIVATE_KEY=.*/gm, `VITE_VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`);
    
    // Add VAPID keys if they don't exist
    if (!envProdContent.includes('VITE_VAPID_PUBLIC_KEY=')) {
      updatedContent += `\nVITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`;
    }
    if (!envProdContent.includes('VITE_VAPID_PRIVATE_KEY=')) {
      updatedContent += `\nVITE_VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`;
    }
    
    // Write the updated content back to the .env.production file
    await fs.writeFile('.env.production', updatedContent);
    console.log('.env.production file updated successfully');
    
    console.log('\nNext steps:');
    console.log('1. Deploy to Vercel using: ./scripts/deploy-all.sh');
    console.log('2. Update the VAPID keys in the Vercel dashboard');
    console.log('3. Clear your browser data and service worker cache');
    console.log('4. Test the notifications on the deployed site');
    
  } catch (error) {
    console.error(`Error updating .env.production file: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();