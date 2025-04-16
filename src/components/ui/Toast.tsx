import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
  action?: ToastAction;
}

export function Toast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000,
  action
}: ToastProps) {
  useEffect(() => {
    // Only auto-close if there's no action
    if (!action) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, action]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-[#4CAF50]';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-[#4CAF50]';
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        getBackgroundColor(), 'text-white'
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
      
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/10 rounded-full transition-colors ml-1"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
