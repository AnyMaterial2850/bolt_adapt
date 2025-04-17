#!/bin/bash

# Step 1: Check if Supabase CLI is installed, install if missing
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found. Installing locally..."
    npm install @supabase/cli --save-dev
else
    echo "Supabase CLI is already installed."
fi

# Step 2: Login to Supabase CLI (non-interactive if possible)
if ! supabase status &> /dev/null
then
    echo "Logging into Supabase CLI..."
    npx supabase login
else
    echo "Supabase CLI already logged in."
fi

# Step 3: Initialize Supabase project if config.toml missing
if [ ! -f "supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    npx supabase init
else
    echo "Supabase project already initialized."
fi

# Step 4: Serve Supabase functions locally with error handling
echo "Starting Supabase functions locally..."
npx supabase functions serve || {
    echo "Failed to start Supabase functions locally."
    exit 1
}

# Instructions:
# - Use Ctrl+C to stop the local server
# - Test your push notification function by sending HTTP requests to the local endpoint
# - When ready, deploy functions with: supabase functions deploy
# - Ensure your VAPID keys are set in Supabase project environment variables
