import { createClient } from '@supabase/supabase-js';
import { useDebugStore } from '../stores/debugStore';
import { handleError } from './error-handling';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'adapt-health-pwa@0.1.0'
    }
  }
});

// Health check function
export const checkSupabaseConnection = async () => {
  const { addLog } = useDebugStore.getState();
  addLog('Starting Supabase connection check...', 'info');

  try {
    // First check if we can connect to Supabase
    const { data, error: pingError } = await supabase
      .from('test_table')
      .select('count')
      .limit(1)
      .single();
    
    if (pingError) {
      addLog(`Connection failed: ${pingError.message}`, 'error');
      return false;
    }

    addLog('Database connection successful', 'success');

    // Then check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      addLog(`Session check failed: ${sessionError.message}`, 'error');
      return false;
    }

    if (session) {
      addLog('Found existing session', 'success');
    } else {
      addLog('No active session', 'info');
    }

    return true;
  } catch (err) {
    const appError = handleError(err);
    addLog('Connection check failed: ' + appError.message, 'error');
    return false;
  }
};

// Add connection state listener
supabase.auth.onAuthStateChange((event, session) => {
  const { addLog } = useDebugStore.getState();
  addLog(`Auth state changed: ${event}`, 'info');
  
  if (event === 'SIGNED_IN') {
    addLog('User signed in successfully', 'success');
  } else if (event === 'SIGNED_OUT') {
    addLog('User signed out', 'info');
  }
});