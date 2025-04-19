import fs from 'fs/promises';

// Function to update the subscription in terminal-notification-test.js
async function updateSubscription(subscriptionData) {
  try {
    // Read the current file
    const filePath = './terminal-notification-test.js';
    let content = await fs.readFile(filePath, 'utf8');
    
    // Parse the subscription data
    let subscription;
    try {
      subscription = JSON.parse(subscriptionData);
    } catch (error) {
      console.error('Error parsing subscription data:', error.message);
      console.error('Make sure the subscription data is valid JSON');
      process.exit(1);
    }
    
    // Create the new subscription code
    const newSubscriptionCode = `const subscription = ${JSON.stringify(subscription, null, 2)};`;
    
    // Replace the old subscription in the file
    const regex = /const subscription = \{[\s\S]*?\};/;
    const updatedContent = content.replace(regex, newSubscriptionCode);
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log('Subscription updated successfully!');
    console.log('You can now run: node terminal-notification-test.js');
  } catch (error) {
    console.error('Error updating subscription:', error.message);
    process.exit(1);
  }
}

// Check if subscription data is provided as command line argument
if (process.argv.length < 3) {
  console.error('Usage: node update-subscription.js \'{"endpoint":"...","keys":{"p256dh":"...","auth":"..."}}\'');
  process.exit(1);
}

// Get the subscription data from command line argument
const subscriptionData = process.argv[2];

// Update the subscription
updateSubscription(subscriptionData);