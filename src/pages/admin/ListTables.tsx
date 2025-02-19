import { useEffect, useState } from 'react';
import { Database, Shield, Table2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { checkDatabaseHealth } from '../../lib/health-check';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface TableInfo {
  table_name: string;
  row_count: number;
}

interface TableDetails extends TableInfo {
  has_rls: boolean;
  policies: string[];
  last_vacuum: string | null;
  last_analyze: string | null;
  estimated_size: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  latency: number;
  lastChecked: Date;
}

export function ListTables() {
  const [tables, setTables] = useState<TableDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    latency: 0,
    lastChecked: new Date(),
  });
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    errors: string[];
    tables: { name: string; exists: boolean; hasRLS: boolean }[];
  } | null>(null);
  const { addLog } = useDebugStore();

  const checkConnection = async () => {
    const start = performance.now();
    try {
      // Test connection using test_table
      const { data, error } = await supabase
        .from('test_table')
        .select('count')
        .limit(1)
        .single();
      
      const latency = performance.now() - start;
      
      setConnectionStatus({
        isConnected: !error,
        latency,
        lastChecked: new Date(),
      });

      if (error) {
        addLog(`Connection check failed: ${error.message}`, 'error');
      } else {
        addLog('Connection check successful', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Connection check error: ${message}`, 'error');
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        lastChecked: new Date(),
      }));
    }
  };

  useEffect(() => {
    async function fetchTables() {
      try {
        setLoading(true);
        addLog('Fetching database tables...', 'info');

        // First get the list of tables
        const { data: tableList, error: tableError } = await supabase
          .from('test_table')
          .select('*');

        if (tableError) {
          addLog(`Failed to fetch tables: ${tableError.message}`, 'error');
          throw tableError;
        }

        // For demonstration, we'll create a mock table list
        const mockTables: TableDetails[] = [
          {
            table_name: 'test_table',
            row_count: tableList?.length || 0,
            has_rls: true,
            policies: ['Authenticated users can view test table'],
            last_vacuum: new Date().toISOString(),
            last_analyze: new Date().toISOString(),
            estimated_size: '1024 bytes',
          }
        ];

        setTables(mockTables);
        addLog(`Found ${mockTables.length} tables`, 'success');

        // Check database health
        const healthResult = await checkDatabaseHealth();
        setHealthStatus(healthResult);
        
        if (!healthResult.isHealthy) {
          addLog(`Health check failed: ${healthResult.errors.join(', ')}`, 'error');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch table data';
        setError(message);
        addLog(message, 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
    checkConnection();

    // Set up periodic connection checks
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [addLog]);

  return (
    <AdminLayout title="Database Debug">
      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Connection Status</h2>
          </div>
          <span className="text-sm text-gray-500">
            Last checked: {connectionStatus.lastChecked.toLocaleTimeString()}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {connectionStatus.isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">Connection</span>
            </div>
            <span className={`text-sm ${connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="font-medium">RLS Status</span>
            </div>
            <span className="text-sm text-gray-600">
              {healthStatus?.tables.every(t => t.hasRLS) 
                ? 'Enabled on all tables' 
                : 'Some tables missing RLS'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Table2 className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Tables</span>
            </div>
            <span className="text-sm text-gray-600">
              {tables.length} tables found
            </span>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && !healthStatus.isHealthy && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 mb-1">Health Check Failed</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {healthStatus.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Row Count
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RLS
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Analyzed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map(table => (
                <tr key={table.table_name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Table2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {table.table_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.row_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.estimated_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {table.has_rls ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.last_analyze 
                      ? new Date(table.last_analyze).toLocaleString()
                      : 'Never'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}