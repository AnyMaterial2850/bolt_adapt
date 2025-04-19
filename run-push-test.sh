#!/bin/bash

# Check if web-push and dotenv are installed
if ! npm list web-push dotenv --depth=0 2>/dev/null | grep -q "web-push"; then
  echo "Installing required dependencies..."
  npm install web-push dotenv
fi

# Check if subscription data is provided
if [ "$#" -ne 1 ]; then
  echo "Usage: ./run-push-test.sh '{\"endpoint\":\"...\",\"keys\":{\"p256dh\":\"...\",\"auth\":\"...\"}}'"
  echo ""
  echo "Example:"
  echo "./run-push-test.sh '{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/...\",\"keys\":{\"p256dh\":\"BASE64_ENCODED_KEY\",\"auth\":\"BASE64_ENCODED_AUTH\"}}'"
  exit 1
fi

# Run the test script
node test-push-notification.js "$1"