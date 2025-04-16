// Script to run the completion cache clearing utility

import { exec } from 'child_process';

console.log('\n======== ADAPT Health Cache Clearing Utility ========');
console.log('This utility helps fix issues with the completionStore\n');

// Function to check if Node.js version supports ESM
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  return major >= 14;
}

// Execute the cache clearing utility script
async function main() {
  if (!checkNodeVersion()) {
    console.error('Error: This script requires Node.js version 14 or higher.');
    process.exit(1);
  }

  console.log('1. Stopping any running development servers...');
  try {
    // Try to find and kill any running Vite processes
    if (process.platform === 'win32') {
      exec('taskkill /f /im node.exe /fi "WINDOWTITLE eq vite"', () => {});
    } else {
      exec("pkill -f 'vite'", () => {});
    }
  } catch (error) {
    // Ignore errors - there might not be any running servers
  }

  console.log('2. Running cache clearing utility...');
  console.log('   This will open in your browser');
  
  // Wait a moment to ensure any killed processes have terminated
  setTimeout(() => {
    try {
      // Run the cache clearing script
      const childProcess = exec('node bolt_adapt/clear-completion-cache.js');
      
      // Forward stdout and stderr
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
      
      // Handle completion
      childProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('\n✅ Cache clearing utility launched successfully.');
          console.log('\nFollow these steps in the opened browser:');
          console.log('1. Click the "Clear Cache" button');
          console.log('2. The application will automatically reload after clearing caches');
          console.log('3. Press Ctrl+C in this terminal when finished\n');
        } else {
          console.error(`\n❌ Cache clearing utility exited with code ${code}`);
        }
      });
    } catch (error) {
      console.error('\n❌ Failed to run cache clearing utility:', error);
    }
  }, 1000);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
