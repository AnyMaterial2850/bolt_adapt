#!/usr/bin/env node

/**
 * Script to test the production build locally
 * This helps identify issues before deploying to Vercel
 */

import { execSync } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer } from 'vite';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log errors
function logError(message) {
  console.error(`${colors.red}${colors.bright}ERROR: ${message}${colors.reset}`);
}

// Helper function to log success
function logSuccess(message) {
  console.log(`${colors.green}${colors.bright}SUCCESS: ${message}${colors.reset}`);
}

// Helper function to log info
function logInfo(message) {
  console.log(`${colors.blue}${colors.bright}INFO: ${message}${colors.reset}`);
}

// Helper function to log warnings
function logWarning(message) {
  console.log(`${colors.yellow}${colors.bright}WARNING: ${message}${colors.reset}`);
}

// Helper function to execute shell commands
function execute(command) {
  try {
    log(`Executing: ${command}`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    logError(`Command failed: ${command}`);
    return false;
  }
}

// Check if the dist directory exists
function checkDistDirectory() {
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    logError('dist directory not found. Build the project first.');
    return false;
  }
  return true;
}

// Check for common issues in the build
function checkBuildIssues() {
  const distPath = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  
  // Check if index.html exists
  if (!fs.existsSync(indexHtmlPath)) {
    logError('index.html not found in dist directory.');
    return false;
  }
  
  // Check if service-worker.js exists
  const serviceWorkerPath = path.join(distPath, 'service-worker.js');
  if (!fs.existsSync(serviceWorkerPath)) {
    logWarning('service-worker.js not found in dist directory. PWA functionality may be limited.');
  }
  
  // Check for manifest.webmanifest
  const manifestPath = path.join(distPath, 'manifest.webmanifest');
  if (!fs.existsSync(manifestPath)) {
    logWarning('manifest.webmanifest not found in dist directory. PWA functionality may be limited.');
  }
  
  // Check for robots.txt
  const robotsPath = path.join(distPath, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    logWarning('robots.txt not found in dist directory. SEO may be affected.');
  }
  
  return true;
}

// Find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  const maxPort = startPort + 10; // Try up to 10 ports
  
  while (port < maxPort) {
    try {
      // Check if port is in use
      const server = http.createServer();
      
      const portAvailable = await new Promise((resolve) => {
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            resolve(false);
          } else {
            resolve(false);
          }
        });
        
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        
        server.listen(port);
      });
      
      if (portAvailable) {
        return port;
      }
      
      port++;
    } catch (error) {
      port++;
    }
  }
  
  throw new Error(`No available ports found between ${startPort} and ${maxPort - 1}`);
}

// Start a local server to serve the production build
async function startProductionServer() {
  const distPath = path.join(__dirname, 'dist');
  
  try {
    // Find an available port
    const port = await findAvailablePort(5000);
    logInfo(`Using port ${port} for the production server`);
    
    // Create a Vite preview server
    const server = await createServer({
      configFile: false,
      root: distPath,
      server: {
        port,
        strictPort: false, // Allow Vite to find another port if needed
        host: true
      },
      preview: {
        port,
        strictPort: false, // Allow Vite to find another port if needed
        host: true
      }
    });
    
    try {
      await server.listen();
    } catch (error) {
      // If the server fails to start on the specified port, try another one
      logWarning(`Failed to start server on port ${port}: ${error.message}`);
      logInfo('Trying another port...');
      
      const newPort = await findAvailablePort(port + 1);
      logInfo(`Using port ${newPort} for the production server`);
      
      server.config.server.port = newPort;
      server.config.preview.port = newPort;
      
      await server.listen();
    }
    
    const serverUrl = `http://localhost:${port}`;
    logSuccess(`Production server started at ${serverUrl}`);
    log('Press Ctrl+C to stop the server', colors.yellow);
    
    // Open the browser
    const openCommand = process.platform === 'win32' 
      ? `start ${serverUrl}` 
      : process.platform === 'darwin' 
        ? `open ${serverUrl}` 
        : `xdg-open ${serverUrl}`;
    
    execute(openCommand);
    
    return server;
  } catch (error) {
    logError(`Failed to start production server: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  log('='.repeat(80), colors.bright);
  log('PRODUCTION BUILD TEST', colors.bright);
  log('='.repeat(80), colors.bright);
  
  // Step 1: Run the build
  logInfo('Step 1: Building the project for production...');
  if (!execute('npm run build')) {
    return;
  }
  
  // Step 2: Check the build output
  logInfo('Step 2: Checking build output...');
  if (!checkDistDirectory() || !checkBuildIssues()) {
    return;
  }
  
  // Step 3: Start a local server to serve the production build
  logInfo('Step 3: Starting production server...');
  const server = await startProductionServer();
  if (!server) {
    return;
  }
  
  // Handle process termination
  process.on('SIGINT', async () => {
    logInfo('Shutting down server...');
    await server.close();
    process.exit(0);
  });
}

// Run the main function
main().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});
