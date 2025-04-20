#!/bin/bash

# Run the sync-vapid-keys.js script to synchronize VAPID keys across environments
echo "Running sync-vapid-keys.js to synchronize VAPID keys..."
node sync-vapid-keys.js

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "VAPID keys synchronized successfully!"
  echo "Remember to update the Vercel environment variables and redeploy the application."
else
  echo "Error synchronizing VAPID keys. Please check the logs for details."
  exit 1
fi