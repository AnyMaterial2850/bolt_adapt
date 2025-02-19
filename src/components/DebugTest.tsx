import { useEffect, useState } from 'react';
import { useDebugStore } from '../stores/debugStore';
import { supabase } from '../lib/supabase';

export function DebugTest() {
  const { addLog } = useDebugStore();
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        addLog('Testing database connection...', 'info');

        // Test basic connection
        const { data: testTableData, error: testError } = await supabase
          .from('test_table')
          .select('*');

        if (testError) {
          addLog(`Test table error: ${testError.message}`, 'error');
          setError(testError.message);
          return;
        }

        addLog(`Found ${testTableData?.length || 0} test records`, 'success');
        setTestData(testTableData);

        // Test habits table
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*');

        if (habitsError) {
          addLog(`Habits table error: ${habitsError.message}`, 'error');
          setError(habitsError.message);
          return;
        }

        addLog(`Found ${habitsData?.length || 0} habits`, 'success');

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Connection test failed: ${message}`, 'error');
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, [addLog]);

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      {loading ? (
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          <h3 className="font-medium mb-2">Connection Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <p>Test Table Records: {testData?.length || 0}</p>
            <pre className="bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}