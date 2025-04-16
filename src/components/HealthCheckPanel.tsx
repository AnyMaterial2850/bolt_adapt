import { useState, useEffect } from 'react';
import { runHealthCheck, createDiagnosticReport, HealthCheckResult } from '../lib/health-check';
import { useDebugStore } from '../stores/debugStore';

interface HealthCheckPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function HealthCheckPanel({ isVisible, onClose }: HealthCheckPanelProps) {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { addLog } = useDebugStore();

  useEffect(() => {
    if (isVisible && !healthResult) {
      runCheck();
    }
  }, [isVisible]);

  const runCheck = async () => {
    setIsLoading(true);
    addLog('Manual health check initiated', 'info');
    
    try {
      const result = await runHealthCheck();
      setHealthResult(result);
    } catch (error) {
      addLog('Health check failed', 'error', { 
        component: 'HealthCheckPanel',
        error: error instanceof Error ? error : new Error(String(error))
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyReportToClipboard = () => {
    if (!healthResult) return;
    
    const report = createDiagnosticReport(healthResult);
    navigator.clipboard.writeText(report)
      .then(() => {
        addLog('Diagnostic report copied to clipboard', 'success');
      })
      .catch((error) => {
        addLog('Failed to copy report to clipboard', 'error', { 
          component: 'HealthCheckPanel',
          error
        });
      });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">System Health Check</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Running health check...</p>
            </div>
          ) : healthResult ? (
            <div>
              <div className="mb-4 flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${healthResult.isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  Status: {healthResult.isHealthy ? 'Healthy' : 'Unhealthy'}
                </span>
                <button 
                  onClick={runCheck}
                  className="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Run Again
                </button>
              </div>
              
              {/* Environment */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Environment</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p>Mode: {healthResult.environment.isProduction ? 'Production' : 'Development'}</p>
                  <p>Node Env: {healthResult.environment.nodeEnv}</p>
                  <p>Version: {healthResult.environment.buildInfo.version}</p>
                  {healthResult.environment.missingEnvVars.length > 0 && (
                    <p className="text-red-500">
                      Missing Env Vars: {healthResult.environment.missingEnvVars.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Database */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Database</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className={healthResult.database.isConnected ? 'text-green-500' : 'text-red-500'}>
                    Connection: {healthResult.database.isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <div className="mt-2">
                    <p className="mb-1">Tables:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {healthResult.database.tables.map(table => (
                        <div key={table.name} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${table.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{table.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Service Worker */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Service Worker</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className={healthResult.serviceWorker.isRegistered ? 'text-green-500' : 'text-red-500'}>
                    Registered: {healthResult.serviceWorker.isRegistered ? 'Yes' : 'No'}
                  </p>
                  {healthResult.serviceWorker.isRegistered && (
                    <>
                      <p>Has Update: {healthResult.serviceWorker.hasUpdate ? 'Yes' : 'No'}</p>
                      {healthResult.serviceWorker.scope && <p>Scope: {healthResult.serviceWorker.scope}</p>}
                    </>
                  )}
                </div>
              </div>
              
              {/* APIs */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">APIs</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className={healthResult.apis.supabase ? 'text-green-500' : 'text-red-500'}>
                    Supabase: {healthResult.apis.supabase ? 'Reachable' : 'Unreachable'}
                  </p>
                  <p className={healthResult.apis.chat ? 'text-green-500' : 'text-red-500'}>
                    Chat API: {healthResult.apis.chat ? 'Reachable' : 'Unreachable'}
                  </p>
                </div>
              </div>
              
              {/* Errors & Warnings */}
              {(healthResult.errors.length > 0 || healthResult.warnings.length > 0) && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Issues</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {healthResult.errors.length > 0 && (
                      <div className="mb-2">
                        <p className="font-medium text-red-500">Errors:</p>
                        <ul className="list-disc pl-5">
                          {healthResult.errors.map((error, i) => (
                            <li key={i} className="text-red-500">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {healthResult.warnings.length > 0 && (
                      <div>
                        <p className="font-medium text-yellow-500">Warnings:</p>
                        <ul className="list-disc pl-5">
                          {healthResult.warnings.map((warning, i) => (
                            <li key={i} className="text-yellow-500">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  {showReport ? 'Hide Report' : 'Show Report'}
                </button>
                <button
                  onClick={copyReportToClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy Report
                </button>
              </div>
              
              {/* Full Report */}
              {showReport && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium mb-2">Full Diagnostic Report</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                    {createDiagnosticReport(healthResult)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No health check data available.
              <div className="mt-4">
                <button
                  onClick={runCheck}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Run Health Check
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
