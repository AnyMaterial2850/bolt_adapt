import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebugStore } from '../stores/debugStore';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const { addLog } = useDebugStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkConnection = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        const wasConnected = isConnected;
        const newConnected = !error;
        setIsConnected(newConnected);

        if (!newConnected) {
          addLog('Database connection lost', 'error');
        } else if (!wasConnected) {
          addLog('Database connection restored', 'success');
        }
      } catch{
        setIsConnected(false);
        addLog('Failed to check database connection', 'error');
      }
    };

    // Check connection immediately and then every 30 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [addLog, isConnected]);

  if (!isOnline || !isConnected) {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            {!isOnline ? 'You are offline' : 'Connection lost'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}