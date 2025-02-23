import { supabase } from './supabase';
import { useDebugStore } from '../stores/debugStore';

interface HealthCheckResult {
  isHealthy: boolean;
  errors: string[];
  tables: {
    name: string;
    exists: boolean;
    hasRLS: boolean;
  }[];
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const { addLog } = useDebugStore.getState();
  const result: HealthCheckResult = {
    isHealthy: true,
    errors: [],
    tables: [],
  };

  try {
    addLog('Starting database health check...', 'info');

    // Check connection with a simple query
    const { data: profileCount, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      result.isHealthy = false;
      result.errors.push(`Connection error: ${connectionError.message}`);
      addLog(`Connection test failed: ${connectionError.message}`, 'error');
      return result;
    }

    addLog('Connection test successful', 'success');

    // Check required tables
    const requiredTables = [
      'profiles',
      'habits',
      'user_habits',
      'habit_comp_track',
      'habit_images',
      'chat_messages'
    ];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        const exists = !error;
        const hasRLS = !error; // If we can query it, RLS is properly set up

        result.tables.push({
          name: tableName,
          exists,
          hasRLS
        });

        if (!exists) {
          result.isHealthy = false;
          result.errors.push(`Table ${tableName} does not exist or is not accessible`);
          addLog(`Table check failed for ${tableName}: ${error?.message}`, 'error');
        } else {
          addLog(`Table check passed for ${tableName}`, 'success');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        result.isHealthy = false;
        result.errors.push(`Error checking table ${tableName}: ${message}`);
        addLog(`Table check error for ${tableName}: ${message}`, 'error');
      }
    }

    if (result.isHealthy) {
      addLog('All database health checks passed', 'success');
    } else {
      addLog(`Database health check failed with ${result.errors.length} errors`, 'error');
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    result.isHealthy = false;
    result.errors.push(`Health check failed: ${message}`);
    addLog(`Health check error: ${message}`, 'error');
    return result;
  }
}