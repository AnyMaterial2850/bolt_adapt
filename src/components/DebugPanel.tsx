import { useDebugStore } from '../stores/debugStore';
import { useState } from 'react';
import { ChevronDown, ChevronUp, XCircle, AlertCircle, CheckCircle, Info, Bug } from 'lucide-react';

export function DebugPanel() {
  const logs = useDebugStore((state) => state.logs);
  const clearLogs = useDebugStore((state) => state.clearLogs);
  const isVisible = useDebugStore((state) => state.isVisible);
  const setVisible = useDebugStore((state) => state.setVisible);
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  // Only hide in production
  if (process.env.NODE_ENV === 'production') return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'debug':
        return <Bug className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  return (
    <>
  {isVisible &&  <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white font-mono text-sm z-[9999]">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <h3 className="text-xs uppercase tracking-wider text-gray-400">Debug Panel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-xs rounded px-2 py-1 border border-gray-700"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="error">Errors</option>
            <option value="success">Success</option>
            <option value="warn">Warnings</option>
            <option value="debug">Debug</option>
          </select>
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-800 px-2 py-1 rounded hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-xs bg-gray-800 px-2 py-1 rounded hover:bg-gray-700"
          >
            Hide
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto p-2 space-y-2">
          {filteredLogs.map((log, index) => (
            <div
              key={`log-${log.timestamp}-${index}`}
              className={`p-2 rounded ${
                log.type === 'error' 
                  ? 'bg-red-900/50 text-red-200' 
                  : log.type === 'success'
                  ? 'bg-green-900/50 text-green-200'
                  : log.type === 'warn'
                  ? 'bg-yellow-900/50 text-yellow-200'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 mt-1">{getIcon(log.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs opacity-70">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.component && (
                      <span className="text-xs bg-gray-800 px-1 rounded">
                        {log.component}
                      </span>
                    )}
                  </div>
                  <p className="break-all whitespace-pre-wrap">{log.message}</p>
                  {log.details && (
                    <pre className="mt-1 text-xs opacity-70 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                  {log.stack && (
                    <pre className="mt-1 text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                      {log.stack}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>}
    </>
  );
}