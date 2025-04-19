import fs from 'fs/promises';
import readline from 'readline';

/**
 * This script extracts push subscription data from browser console logs.
 * It helps bridge the gap between browser-based subscriptions and terminal testing.
 * 
 * Web Push Notifications require:
 * 1. A browser to register a service worker and create a subscription
 * 2. A terminal/server to send notifications to that subscription
 * 
 * The browser is needed because:
 * - Only browsers can register service workers
 * - Only browsers can create push subscriptions with FCM/other push services
 * - Only browsers can display web notifications
 * 
 * The terminal can send notifications but cannot create subscriptions or display them.
 */

// Function to extract subscription from a log file
async function extractSubscription(logFilePath) {
  try {
    // Check if the log file exists
    try {
      await fs.access(logFilePath);
    } catch (error) {
      console.error(`Log file not found: ${logFilePath}`);
      console.error('Please provide a valid log file path');
      return null;
    }
    
    // Create a read stream for the log file
    const fileStream = await fs.open(logFilePath, 'r');
    const rl = readline.createInterface({
      input: fileStream.createReadStream(),
      crlfDelay: Infinity
    });
    
    // Look for subscription data in the logs
    let subscriptionData = null;
    let inSubscriptionBlock = false;
    let subscriptionLines = [];
    
    for await (const line of rl) {
      // Look for lines that might contain subscription data
      if (line.includes('PushSubscription') || line.includes('"endpoint":') || line.includes('"keys":')) {
        inSubscriptionBlock = true;
        subscriptionLines.push(line);
      } 
      // If we're in a subscription block and hit a line that doesn't look like JSON, end the block
      else if (inSubscriptionBlock && !line.match(/[{},":]/)) {
        inSubscriptionBlock = false;
        
        // Try to extract JSON from the collected lines
        const jsonText = subscriptionLines.join(' ')
          .replace(/^.*?({.*}).*$/, '$1') // Extract JSON object
          .replace(/'/g, '"'); // Replace single quotes with double quotes
        
        try {
          subscriptionData = JSON.parse(jsonText);
          break; // Found valid subscription data, exit the loop
        } catch (e) {
          // Reset and continue looking
          subscriptionLines = [];
        }
      }
      // Continue collecting lines if we're in a subscription block
      else if (inSubscriptionBlock) {
        subscriptionLines.push(line);
      }
    }
    
    // Close the file
    await fileStream.close();
    
    return subscriptionData;
  } catch (error) {
    console.error('Error extracting subscription:', error.message);
    return null;
  }
}

// Function to update the subscription in terminal-notification-test.js
async function updateTestScript(subscription) {
  try {
    // Read the current file
    const filePath = './terminal-notification-test.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Create the new subscription code
    const newSubscriptionCode = `const subscription = ${JSON.stringify(subscription, null, 2)};`;
    
    // Replace the old subscription in the file
    const regex = /const subscription = \{[\s\S]*?\};/;
    const updatedContent = content.replace(regex, newSubscriptionCode);
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log('Subscription updated in terminal-notification-test.js');
    console.log('You can now run: node terminal-notification-test.js');
  } catch (error) {
    console.error('Error updating test script:', error.message);
  }
}

// Main function
async function main() {
  console.log('Web Push Notification Terminal Tester');
  console.log('=====================================');
  console.log('');
  console.log('This tool helps test push notifications from the terminal.');
  console.log('');
  console.log('Why we need both browser and terminal:');
  console.log('1. Browser: Creates subscriptions and displays notifications');
  console.log('2. Terminal: Tests sending notifications to those subscriptions');
  console.log('');
  
  // Check if log file path is provided
  if (process.argv.length < 3) {
    console.log('Usage: node extract-subscription.js <path-to-browser-log-file>');
    console.log('');
    console.log('To get browser logs:');
    console.log('1. Open your browser console (F12 or Ctrl+Shift+J)');
    console.log('2. Save the console output to a file');
    console.log('3. Run this script with the path to that file');
    return;
  }
  
  // Get the log file path from command line argument
  const logFilePath = process.argv[2];
  
  // Extract subscription from the log file
  console.log(`Extracting subscription from ${logFilePath}...`);
  const subscription = await extractSubscription(logFilePath);
  
  if (subscription) {
    console.log('Found subscription:');
    console.log(JSON.stringify(subscription, null, 2));
    
    // Update the test script with the extracted subscription
    await updateTestScript(subscription);
  } else {
    console.log('No valid subscription found in the log file.');
    console.log('Please make sure the log file contains push subscription data.');
  }
}

// Run the main function
main();