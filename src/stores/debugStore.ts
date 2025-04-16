
import { create } from 'zustand';

export type LogType = 'info' | 'error' | 'success' | 'warn' | 'debug';

interface DebugLog {
  message: string;
  type: LogType;
  timestamp: number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  component?: string;
  stack?: string;
}

interface DebugState {
  logs: DebugLog[];
  isVisible: boolean;
  isHealthCheckVisible: boolean;
  addLog: (message: string, type: LogType, details?: { component?: string; error?: Error; 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any 
}) => void;
  clearLogs: () => void;
  setVisible: (visible: boolean) => void;
  toggle: () => void;
  setHealthCheckVisible: (visible: boolean) => void;
}


export const useDebugStore = create<DebugState>((set) => ({
  logs: [],
  isVisible: false, // Hidden by default
  isHealthCheckVisible: false, // Health check panel hidden by default
  addLog: (message, type = 'info', details = {}) => {
    const log: DebugLog = {
      message,
      type,
      timestamp: Date.now(),
      component: details.component,
      stack: details.error?.stack,
      details: details.data
    };

    // Log to console with appropriate styling
    const styles = {
      info: 'color: #007FFF',
      error: 'color: #FF0000; font-weight: bold',
      success: 'color: #32CD32',
      warn: 'color: #FFA500',
      debug: 'color: #808080'
    };

    console.group(`%c[${type.toUpperCase()}] ${message}`, styles[type]);
    if (details.component) console.log('Component:', details.component);
    if (details.data) console.log('Data:', details.data);
    if (details.error) console.error('Error:', details.error);
    console.groupEnd();

    set((state) => ({
      logs: [log, ...state.logs].slice(0, 1000), // Keep last 1000 logs
    }));
  },
  clearLogs: () => set({ logs: [] }),
  setVisible: (visible) => set({ isVisible: visible }),
  toggle: () => set((state) => ({ isVisible: !state.isVisible })),
  setHealthCheckVisible: (visible) => set({ isHealthCheckVisible: visible }),
}));
