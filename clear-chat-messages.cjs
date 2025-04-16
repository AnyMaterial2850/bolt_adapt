// Script to clear all chat messages from the database
// Use CommonJS syntax for Node.js script
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with hardcoded credentials from .env
const supabaseUrl = 'https://tukucvihlyqdxehzeodv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1a3VjdmlobHlxZHhlaHplb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjgxMTUsImV4cCI6MjA1NTA0NDExNX0.SZ4hLFWNfCdwt3QVJwh0uvVUbjdp1q9BC0-XkrXlwJ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearChatMessages() {
  console.log('Clearing all chat messages from the database...');
  
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all messages (dummy condition to match all)
    
    if (error) {
      throw error;
    }
    
    console.log('Successfully cleared all chat messages.');
  } catch (err) {
    console.error('Error clearing chat messages:', err);
  }
}

clearChatMessages();
