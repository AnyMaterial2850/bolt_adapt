# Deploying ADAPT Health to Vercel

This document provides instructions for deploying the ADAPT Health application to Vercel.

## Prerequisites

- A Vercel account
- Git repository with your ADAPT Health code
- Supabase project set up and configured
- VAPID keys generated for push notifications (if using push notifications)

## Environment Variables

The following environment variables need to be set in your Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notifications | Yes, if using push notifications |
| `VITE_APP_VERSION` | Application version (set automatically by build script) | No |
| `VITE_BUILD_TIME` | Build timestamp (set automatically by build script) | No |

> **IMPORTANT**: Do not store sensitive keys in your repository. Always use the Vercel dashboard to set environment variables. The `.env.production` file in the repository should only contain placeholder values or non-sensitive variables.

> **SECURITY NOTE**: Make sure your Supabase Row Level Security (RLS) policies are properly configured before deploying to production. The anonymous key is exposed to the client, so proper RLS policies are essential for security.

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Import your Git repository
4. Select the ADAPT Health project

### 2. Configure Project Settings

1. Set the Framework Preset to "Vite"
2. Set the Root Directory to "bolt_adapt" (if your project is in a subdirectory)
3. Set the Build Command to `npm run build:vercel`
4. Set the Output Directory to "dist"

### 3. Set Environment Variables

Add all required environment variables in the Vercel project settings:
1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add each required variable with its corresponding value
4. Make sure to select the appropriate environments (Production, Preview, Development)

### 4. Deploy

Click "Deploy" to start the deployment process.

## Vercel Configuration

The project includes a `vercel.json` file that configures:

- Build settings
- Routing rules (SPA fallback to index.html)
- Cache headers for optimal performance
- Security headers

The configuration uses Vercel's newer format with `rewrites` and `headers` properties instead of the older `routes` property.

## Troubleshooting

If you encounter issues during deployment, check the following:

### Service Worker Issues

- Ensure the service worker is properly registered in `main.tsx`
- Check that the service worker path is correct in `vercel.json`
- Verify that the service worker is being properly cached
- Check browser console for any service worker registration errors

### Environment Variable Issues

- Verify that all required environment variables are set in Vercel
- Check that the environment variables are being properly accessed in the code
- Remember that environment variables are injected at build time, not runtime

### Build Issues

- Check the build logs for any errors
- Ensure that the build command is correctly set to `npm run build:vercel`
- Verify that the output directory is correctly set to "dist"
- Make sure all dependencies are properly installed

## Health Check

The application includes a built-in health check system that can help diagnose issues in production:

1. Access the debug panel by tapping the top-right corner of the screen 7 times in quick succession
2. Click the "Health Check" button in the debug panel
3. Review the health check results to identify any issues

The health check will verify:
- Supabase connection
- Service worker registration
- Environment variables
- Browser capabilities

## Testing Production Build Locally

Before deploying to Vercel, you can test the production build locally:

```bash
cd bolt_adapt && npm run test:prod
```

This will:
1. Build the application for production
2. Check the build output for common issues
3. Start a local server to serve the production build
4. Open the application in your browser

If you encounter context window issues with the test script, you can run the steps manually:

```bash
# Build the project
cd bolt_adapt && npm run build

# Serve the production build
cd bolt_adapt && npx vite preview
```

## Deployment Checklist

- [ ] All environment variables are set in Vercel dashboard
- [ ] Service worker is properly configured
- [ ] Build command is set to `npm run build:vercel`
- [ ] Output directory is set to "dist"
- [ ] Production build has been tested locally
- [ ] Health check system is working properly
- [ ] PWA manifest is correctly configured
- [ ] Offline functionality has been tested
- [ ] Supabase RLS policies are properly configured
- [ ] VAPID keys are set for push notifications (if using)
- [ ] All API endpoints are properly secured
- [ ] Cache headers are correctly configured in vercel.json
