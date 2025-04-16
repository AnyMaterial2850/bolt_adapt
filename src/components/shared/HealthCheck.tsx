import { useEffect, useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { runHealthCheck, HealthCheckResult } from '../../lib/health-check';
import { useDebugStore } from '../../stores/debugStore';
import { Toast } from '../ui/Toast';

export function HealthCheck() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { addLog, setHealthCheckVisible } = useDebugStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await runHealthCheck();
        setHealth(result);
        
        if (!result.isHealthy) {
          addLog(`Health check failed: ${result.errors.join(', ')}`, 'error');
          setShowToast(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Health check error: ${message}`, 'error');
        setHealth({
          timestamp: new Date().toISOString(),
          isHealthy: false,
          errors: [message],
          warnings: [],
          environment: {
            isProduction: import.meta.env.MODE === 'production',
            missingEnvVars: [],
            nodeEnv: import.meta.env.MODE || 'unknown',
            buildInfo: {
              version: import.meta.env.VITE_APP_VERSION || '0.1.0',
              buildTime: new Date().toISOString()
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
        });
        setShowToast(true);
      }
    };

    // Check health immediately and then every 5 minutes
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [addLog]);

  if (!health || health.isHealthy) return null;

  return (
    <>
      <div 
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 cursor-pointer"
        onClick={() => setHealthCheckVisible(true)}
      >
        <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            System issues detected
          </span>
          <Activity className="w-4 h-4 ml-1" />
        </div>
      </div>

      {showToast && (
        <Toast
          message={
            health.database.isConnected 
              ? "System issues detected. Some features may be unavailable."
              : "Database connection issues detected. Some features may be unavailable."
          }
          type="error"
          onClose={() => setShowToast(false)}
          action={{
            label: "Details",
            onClick: () => setHealthCheckVisible(true)
          }}
        />
      )}
    </>
  );
}
