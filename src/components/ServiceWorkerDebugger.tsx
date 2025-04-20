import { useEffect, useState } from 'react';

export function ServiceWorkerDebugger() {
  const [messages, setMessages] = useState<Array<{type: string; timestamp: string; data: any}>>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Function to handle messages from the service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data;
      
      // Only process messages from the service worker
      if (data && (
        data.type === 'PUSH_RECEIVED' ||
        data.type === 'NOTIFICATION_CLICKED' ||
        data.type === 'PUSH_RECEIVED_FALLBACK' ||
        data.type === 'PUSH_ERROR'
      )) {
        console.log('Received message from service worker:', data);
        
        setMessages(prev => [
          {
            type: data.type,
            timestamp: new Date().toLocaleTimeString(),
            data: data
          },
          ...prev
        ].slice(0, 50)); // Keep only the last 50 messages
      }
    };

    // Add event listener for messages from the service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Clean up the event listener when the component unmounts
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // If there are no messages, don't render anything
  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg border border-gray-200 max-w-md">
      <div 
        className="p-2 bg-blue-100 rounded-t-lg flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium">Service Worker Messages ({messages.length})</h3>
        <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-2 max-h-60 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="mb-2 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium">{message.type} - {message.timestamp}</div>
              <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(message.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}