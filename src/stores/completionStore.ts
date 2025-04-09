import { create } from 'zustand';
import { completionService } from '../services/completionService';
import { useDebugStore } from './debugStore';

interface CompletionState {
  // Completions map: key is `${habitId}-${date}-${eventTime}`, value is completion status
  completions: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  updatingCompletion: string | null;
  
  // Actions
  loadCompletions: (userHabitIds: string[], date: Date) => Promise<void>;
  toggleCompletion: (habitId: string, date: Date, eventTime: string) => Promise<boolean>;
  clearCompletions: () => void;
}

export const useCompletionStore = create<CompletionState>((set, get) => ({
  // State
  completions: {},
  loading: false,
  error: null,
  updatingCompletion: null,
  
  // Actions
  loadCompletions: async (userHabitIds: string[], date: Date) => {
    const { addLog } = useDebugStore.getState();
    
    if (userHabitIds.length === 0) {
      set({ completions: {}, loading: false });
      return;
    }
    
    addLog('Loading habit completions...', 'info', { component: 'completionStore.loadCompletions' });
    set({ loading: true, error: null });
    
    const result = await completionService.getCompletions(userHabitIds, date);
    
    if (result.success && result.data) {
      set({ completions: result.data, loading: false });
      addLog(`Loaded ${Object.keys(result.data).length} completions`, 'success', { 
        component: 'completionStore.loadCompletions' 
      });
    } else {
      set({ error: result.error || 'Failed to load completions', loading: false });
      addLog(`Failed to load completions: ${result.error}`, 'error', { 
        component: 'completionStore.loadCompletions' 
      });
    }
  },
  
  toggleCompletion: async (habitId: string, date: Date, eventTime: string) => {
    const { addLog } = useDebugStore.getState();
    const { completions, updatingCompletion } = get();
    
    // Create a key for this completion
    const dateStr = date.toISOString().split('T')[0];
    const completionKey = `${habitId}-${dateStr}-${eventTime}`;
    
    // Prevent multiple clicks while updating
    if (updatingCompletion === completionKey) return false;
    
    // Check if already completed
    const isCompleted = completions[completionKey];
    
    // Set updating state
    set({ updatingCompletion: completionKey });
    
    try {
      // Call the appropriate service method
      const result = isCompleted
        ? await completionService.markIncomplete(habitId, date, eventTime)
        : await completionService.markCompleted(habitId, date, eventTime);
      
      if (result.success) {
        // Update local state
        set(state => {
          const newCompletions = { ...state.completions };
          
          if (isCompleted) {
            // Remove completion
            delete newCompletions[completionKey];
          } else {
            // Add completion
            newCompletions[completionKey] = true;
          }
          
          return { completions: newCompletions };
        });
        
        addLog(`Habit ${isCompleted ? 'unmarked' : 'marked'} as completed`, 'success', { 
          component: 'completionStore.toggleCompletion' 
        });
        
        return true;
      } else {
        addLog(`Failed to toggle completion: ${result.error}`, 'error', { 
          component: 'completionStore.toggleCompletion' 
        });
        
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle completion';
      addLog(`Error: ${message}`, 'error', { component: 'completionStore.toggleCompletion' });
      return false;
    } finally {
      set({ updatingCompletion: null });
    }
  },
  
  clearCompletions: () => {
    set({ completions: {}, error: null });
  }
}));
