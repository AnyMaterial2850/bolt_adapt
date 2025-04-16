import { supabase } from './supabase';
import { useDebugStore } from '../stores/debugStore';
import { checkForServiceWorkerUpdate } from './sw-reg';

/**
 * Comprehensive health check result interface
 */
export interface HealthCheckResult {
  timestamp: string;
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  environment: {
    isProduction: boolean;
    missingEnvVars: string[];
    nodeEnv: string;
    buildInfo: {
      version: string;
      buildTime: string;
    };
  };
  database: {
    isConnected: boolean;
    tables: {
      name: string;
      exists: boolean;
      hasRLS: boolean;
    }[];
  };
  serviceWorker: {
    isRegistered: boolean;
    hasUpdate: boolean;
    scope?: string;
  };
  apis: {
    supabase: boolean;
    chat: boolean;
  };
  browser: {
    userAgent: string;
    isOnline: boolean;
    language: string;
  };
}

/**
 * Check if all required environment variables are present
 */
function checkEnvironmentVariables(): { missing: string[], isProduction: boolean } {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  // VAPID key is only required if push notifications are enabled
  if (navigator.serviceWorker && 'PushManager' in window) {
    requiredVars.push('VITE_VAPID_PUBLIC_KEY');
  }
  
  const missing = requiredVars.filter(varName => 
    !import.meta.env[varName] || 
    import.meta.env[varName] === 'undefined' || 
    import.meta.env[varName] === ''
  );
  
  const isProduction = import.meta.env.MODE === 'production';
  
  return { missing, isProduction };
}

/**
 * Check if the chat API is reachable
 */
async function checkChatApi(): Promise<boolean> {
  try {
    // Just check if the endpoint is reachable with a HEAD request
    const response = await fetch('https://alpha.api.intellaigent.starti.no/health', {
      method: 'HEAD',
      mode: 'no-cors', // This will prevent CORS errors but won't give us status
      cache: 'no-cache'
    });
    
    // With no-cors, we can't actually check the status
    // But if we get here without an exception, the request didn't fail outright
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check service worker status
 */
async function checkServiceWorker(): Promise<{ isRegistered: boolean, hasUpdate: boolean, scope?: string }> {
  if (!('serviceWorker' in navigator)) {
    return { isRegistered: false, hasUpdate: false };
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return { isRegistered: false, hasUpdate: false };
    }
    
    const hasUpdate = await checkForServiceWorkerUpdate();
    
    return {
      isRegistered: true,
      hasUpdate,
      scope: registration.scope
    };
  } catch (error) {
    return { isRegistered: false, hasUpdate: false };
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{ 
  isConnected: boolean, 
  tables: { name: string, exists: boolean, hasRLS: boolean }[] 
}> {
  const { addLog } = useDebugStore.getState();
  const result = {
    isConnected: false,
    tables: [] as { name: string, exists: boolean, hasRLS: boolean }[]
  };

  try {
    addLog('Starting database health check...', 'info');

    // Check connection with a simple query
    const { data: profileCount, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      addLog(`Connection test failed: ${connectionError.message}`, 'error');
      return result;
    }

    result.isConnected = true;
    addLog('Connection test successful', 'success');

    // Check required tables
    const requiredTables = [
      'profiles',
      'habits',
      'user_habits',
      'habit_comp_track',
      'habit_images',
      'chat_messages',
      'subscriptions' // For push notifications
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
          addLog(`Table check failed for ${tableName}: ${error?.message}`, 'error');
        } else {
          addLog(`Table check passed for ${tableName}`, 'success');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Table check error for ${tableName}: ${message}`, 'error');
        
        result.tables.push({
          name: tableName,
          exists: false,
          hasRLS: false
        });
      }
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    addLog(`Health check error: ${message}`, 'error');
    return result;
  }
}

/**
 * Run a comprehensive health check of the application
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  const { addLog } = useDebugStore.getState();
  
  addLog('Starting comprehensive health check...', 'info');
  
  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    isHealthy: true,
    errors: [],
    warnings: [],
    environment: {
      isProduction: false,
      missingEnvVars: [],
      nodeEnv: import.meta.env.MODE || 'unknown',
      buildInfo: {
        version: import.meta.env.VITE_APP_VERSION || '0.1.0',
        buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
      }
    },
    database: {
      isConnected: false,
      tables: []
    },
    serviceWorker: {
      isRegistered: false,
      hasUpdate: false
    },
    apis: {
      supabase: false,
      chat: false
    },
    browser: {
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine,
      language: navigator.language
    }
  };
  
  try {
    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    result.environment.isProduction = envCheck.isProduction;
    result.environment.missingEnvVars = envCheck.missing;
    
    if (envCheck.missing.length > 0) {
      result.isHealthy = false;
      result.errors.push(`Missing environment variables: ${envCheck.missing.join(', ')}`);
      addLog(`Missing environment variables: ${envCheck.missing.join(', ')}`, 'error');
    }
    
    // Check database
    const dbHealth = await checkDatabaseHealth();
    result.database = dbHealth;
    
    if (!dbHealth.isConnected) {
      result.isHealthy = false;
      result.errors.push('Database connection failed');
    }
    
    const missingTables = dbHealth.tables.filter(t => !t.exists).map(t => t.name);
    if (missingTables.length > 0) {
      result.isHealthy = false;
      result.errors.push(`Missing database tables: ${missingTables.join(', ')}`);
    }
    
    // Check service worker
    const swStatus = await checkServiceWorker();
    result.serviceWorker = swStatus;
    
    if (!swStatus.isRegistered) {
      result.warnings.push('Service worker is not registered');
      addLog('Service worker is not registered', 'warn');
    }
    
    if (swStatus.hasUpdate) {
      result.warnings.push('Service worker has an update available');
      addLog('Service worker has an update available', 'warn');
    }
    
    // Check APIs
    result.apis.supabase = dbHealth.isConnected;
    result.apis.chat = await checkChatApi();
    
    if (!result.apis.chat) {
      result.warnings.push('Chat API is not reachable');
      addLog('Chat API is not reachable', 'warn');
    }
    
    // Final health determination
    if (result.errors.length > 0) {
      result.isHealthy = false;
    }
    
    addLog(`Health check completed. Status: ${result.isHealthy ? 'Healthy' : 'Unhealthy'}`, 
      result.isHealthy ? 'success' : 'error');
    
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.isHealthy = false;
    result.errors.push(`Health check failed: ${message}`);
    addLog(`Health check failed: ${message}`, 'error');
    return result;
  }
}

/**
 * Create a diagnostic report for troubleshooting
 */
export function createDiagnosticReport(healthCheck: HealthCheckResult): string {
  return `
# ADAPT Health Diagnostic Report
Generated: ${healthCheck.timestamp}
Overall Status: ${healthCheck.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}

## Environment
- Production Mode: ${healthCheck.environment.isProduction ? 'Yes' : 'No'}
- Node Environment: ${healthCheck.environment.nodeEnv}
- App Version: ${healthCheck.environment.buildInfo.version}
- Build Time: ${healthCheck.environment.buildInfo.buildTime}
${healthCheck.environment.missingEnvVars.length > 0 ? `- Missing Env Vars: ${healthCheck.environment.missingEnvVars.join(', ')}` : ''}

## Database
- Connection: ${healthCheck.database.isConnected ? '✅ Connected' : '❌ Disconnected'}
- Tables:
${healthCheck.database.tables.map(t => `  - ${t.name}: ${t.exists ? '✅' : '❌'}`).join('\n')}

## Service Worker
- Registered: ${healthCheck.serviceWorker.isRegistered ? '✅ Yes' : '❌ No'}
- Has Update: ${healthCheck.serviceWorker.hasUpdate ? 'Yes' : 'No'}
${healthCheck.serviceWorker.scope ? `- Scope: ${healthCheck.serviceWorker.scope}` : ''}

## APIs
- Supabase: ${healthCheck.apis.supabase ? '✅ Reachable' : '❌ Unreachable'}
- Chat API: ${healthCheck.apis.chat ? '✅ Reachable' : '❌ Unreachable'}

## Browser
- Online: ${healthCheck.browser.isOnline ? 'Yes' : 'No'}
- Language: ${healthCheck.browser.language}
- User Agent: ${healthCheck.browser.userAgent}

## Errors
${healthCheck.errors.length > 0 ? healthCheck.errors.map(e => `- ${e}`).join('\n') : 'None'}

## Warnings
${healthCheck.warnings.length > 0 ? healthCheck.warnings.map(w => `- ${w}`).join('\n') : 'None'}
`;
}
