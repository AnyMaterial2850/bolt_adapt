import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
async function getAccessToken(userId) {
  console.log(`Getting access token for user ID: ${userId}`);
  
  try {
    // Create a temporary JWT token for the user using the service role key
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: 'temp@example.com', // This doesn't matter for our purpose
        user_id: userId,
        data: {}
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate token: ${errorText}`);
    }
    
    const data = await response.json();
    return data.properties.access_token;
  } catch (error) {
    console.error(`Error getting access token: ${error.message}`);
    throw error;
  }
}

async function sendNotification(userId, accessToken) {
  console.log('=== Testing API Notification ===');
  console.log(`Sending notification to user ID: ${userId}`);
  
  try {
    // Determine the API URL based on environment
    const isProduction = process.argv.includes('--production');
    const apiUrl = isProduction 
      ? 'https://adapt-3logbcsaa-adaptjourneyteam.vercel.app/api/createNotification'
      : 'http://localhost:3000/api/createNotification';
    
    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Using access token: ${accessToken.substring(0, 10)}...`);
    
    // Send the notification request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        userId: userId,
        title: 'API Test Notification',
        body: `This is a test notification sent via the API at ${new Date().toLocaleTimeString()}`,
        data: { 
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    // Parse the response
    const result = await response.json();
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('Notification sent successfully!');
      
      // Check if any notifications were actually sent
      const successful = result.results?.filter(r => r.status === 'fulfilled' && r.value.success).length || 0;
      const failed = result.results?.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length || 0;
      
      console.log(`Successful notifications: ${successful}`);
      console.log(`Failed notifications: ${failed}`);
      
      // Log details of any failures
      if (failed > 0) {
        console.log('Failed notification details:');
        result.results
          .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
          .forEach((r, i) => {
            console.log(`Failure ${i + 1}:`, r.status === 'rejected' ? r.reason : r.value);
          });
      }
    } else {
      console.error('Error sending notification:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
  }
}

async function main() {
  try {
    // Get the user ID from the command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.error('Usage: node test-api-notification.js <user_id> [--production]');
      process.exit(1);
    }
    
    // Get an access token for the user
    const accessToken = await getAccessToken(userId);
    
    // Send the notification
    await sendNotification(userId, accessToken);
  } catch (error) {
    console.error(`Main error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();