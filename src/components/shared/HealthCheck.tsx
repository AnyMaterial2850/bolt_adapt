import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { checkDatabaseHealth } from '../../lib/health-check';
import { useDebugStore } from '../../stores/debugStore';
import { Toast } from '../ui/Toast';

export function HealthCheck() {
  const [health, setHealth] = useState<{ isHealthy: boolean; errors: string[] } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { addLog } = useDebugStore();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await checkDatabaseHealth();
        setHealth(result);
        
        if (!result.isHealthy) {
          addLog(`Health check failed: ${result.errors.join(', ')}`, 'error');
          setShowToast(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Health check error: ${message}`, 'error');
        setHealth({ isHealthy: false, errors: [message] });
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
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            System issues detected
          </span>
        </div>
      </div>

      {showToast && (
        <Toast
          message="Database connection issues detected. Some features may be unavailable."
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}