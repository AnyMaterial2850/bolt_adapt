import { useDebugStore } from '../stores/debugStore';

export interface ErrorResult {
  message: string;
  originalError?: unknown;
}

export const errorService = {
  /**
   * Centralized error handling function
   * @param error The original error
   * @param fallbackMessage A fallback message if the error doesn't have a message
   * @param options Additional options for error handling
   * @returns An ErrorResult object with a consistent message
   */
  handleError: (
    error: unknown, 
    fallbackMessage: string,
    options: {
      logToDebug?: boolean;
      component?: string;
    } = { logToDebug: true }
  ): ErrorResult => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    
    // Log to debug store if requested
    if (options.logToDebug) {
      const { addLog } = useDebugStore.getState();
      addLog(message, 'error', { 
        component: options.component,
        error: error instanceof Error ? error : undefined
      });
    }
    
    return { 
      message,
      originalError: error
    };
  }
};
