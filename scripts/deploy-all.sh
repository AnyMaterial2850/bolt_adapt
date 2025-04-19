#!/bin/bash

# Step 1: Check for uncommitted changes and commit them
if [[ -n $(git status -s) ]]; then
  echo "Uncommitted changes detected. Adding and committing..."
  git add .
  git commit -m "Auto commit before deploy $(date +'%Y-%m-%d %H:%M:%S')"
else
  echo "No uncommitted changes."
fi

# Step 2: Check if git remote 'origin' exists
if git remote | grep -q origin; then
  echo "Pushing to remote repository..."
  git push origin main || {
    echo "Failed to push to remote repository."
    exit 1
  }
else
  echo "Git remote 'origin' not found. Skipping git push."
fi

# Step 3: Build the Vercel app
echo "Building Vercel app..."
npm run build:vercel || {
  echo "Build failed."
  exit 1
}

# Step 4: Deploy to Vercel
# Note: We're skipping Supabase functions deployment as we've migrated to Vercel serverless functions
echo "Deploying to Vercel..."
npx vercel --prod || {
  echo "Vercel deploy failed."
  exit 1
}

echo "Deployment complete."
