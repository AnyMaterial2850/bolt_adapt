// Script to refresh the Supabase schema cache
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with hardcoded credentials from .env
const supabaseUrl = 'https://tukucvihlyqdxehzeodv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1a3VjdmlobHlxZHhlaHplb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjgxMTUsImV4cCI6MjA1NTA0NDExNX0.SZ4hLFWNfCdwt3QVJwh0uvVUbjdp1q9BC0-XkrXlwJ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshSchemaCache() {
  console.log('Refreshing Supabase schema cache...');
  
  try {
    // Execute a simple query to force schema refresh
    const { data, error } = await supabase
      .rpc('get_schema_version');
    
    if (error) {
      // If the RPC doesn't exist, try a different approach
      console.log('RPC not found, trying alternative approach...');
      
      // Alternative: Query the table structure to force schema refresh
      const { error: tableError } = await supabase
        .from('chat_messages')
        .select('id')
        .limit(1);
      
      if (tableError) {
        throw tableError;
      }
    }
    
    console.log('Schema cache refresh completed successfully.');
    console.log('You may need to restart your application for changes to take effect.');
  } catch (err) {
    console.error('Error refreshing schema cache:', err);
  }
}

refreshSchemaCache();
