import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sendNotification(userId) {
  console.log('=== Testing API Notification (Simple) ===');
  console.log(`Sending notification to user ID: ${userId}`);
  
  try {
    // Determine the API URL based on environment
    const isProduction = process.argv.includes('--production');
    const apiUrl = isProduction 
      ? 'https://adapt-3logbcsaa-adaptjourneyteam.vercel.app/api/createNotification'
      : 'http://localhost:3000/api/createNotification';
    
    console.log(`Using API URL: ${apiUrl}`);
    
    // Send the notification request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        userId: userId,
        title: 'Simple API Test',
        body: `This is a test notification sent via the API at ${new Date().toLocaleTimeString()}`,
        data: { 
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    // Parse the response
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
      console.log('Response body (JSON):', JSON.stringify(result, null, 2));
    } else {
      result = await response.text();
      console.log('Response body (Text):', result);
    }
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('Notification sent successfully!');
      
      // Check if any notifications were actually sent
      if (typeof result === 'object' && result.results) {
        const successful = result.results.filter(r => r.status === 'fulfilled' && r.value.success).length || 0;
        const failed = result.results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length || 0;
        
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
      }
    } else {
      console.error('Error sending notification:', typeof result === 'object' ? result.error || 'Unknown error' : result);
    }
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    console.error(error.stack);
  }
}

async function main() {
  try {
    // Get the user ID from the command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.error('Usage: node test-api-simple.js <user_id> [--production]');
      process.exit(1);
    }
    
    // Send the notification
    await sendNotification(userId);
  } catch (error) {
    console.error(`Main error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();