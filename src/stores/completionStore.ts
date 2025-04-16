import { create } from 'zustand';
import { completionService } from '../services/completionService';
import { useDebugStore } from './debugStore';

// Helper function for array comparison
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

interface CompletionState {
  // Store completions as a map of habit completion keys to boolean values
  // Format of key: `${habitId}-${dateStr}-${eventTime}`
  completions: Record<string, boolean>;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Cache control - these track what's currently loaded to prevent redundant calls
  lastLoadedDate: string | null;
  lastLoadedHabitIds: string[];
  loadedAt: number | null;
  
  // Actions
  loadCompletions: (userHabitIds: string[], date: Date) => Promise<void>;
  toggleCompletion: (habitId: string, date: Date, eventTime: string) => Promise<boolean>;
  clearCompletions: () => void;
  getCompletionStatus: (habitId: string, date: Date, eventTime: string) => boolean;
}

export const useCompletionStore = create<CompletionState>((set, get) => ({
  // State
  completions: {},
  loading: false,
  error: null,
  lastLoadedDate: null,
  lastLoadedHabitIds: [],
  loadedAt: null,
  
  // Actions
  loadCompletions: async (userHabitIds: string[], date: Date) => {
    const { addLog } = useDebugStore.getState();
    const dateStr = date.toISOString().split('T')[0];
    
    // If we're already loading or have no habit IDs, don't proceed
    if (get().loading || userHabitIds.length === 0) {
      addLog('Skipping completion load - already loading or no habits', 'info');
      return;
    }
    
    // Check if we already have the correct data for this date and habits
    const habitsMatch = arraysEqual(get().lastLoadedHabitIds, userHabitIds);
    const alreadyLoaded = get().lastLoadedDate === dateStr && habitsMatch;
    
    // Skip if we loaded this exact data recently (within 10 seconds)
    const now = Date.now();
    const { loadedAt } = get();
    const loadedRecently = loadedAt !== null && (now - loadedAt < 10000);
    
    if (alreadyLoaded && loadedRecently) {
      addLog('Skipping completion load - already loaded this data recently', 'info');
      return;
    }
    
    set({ loading: true, error: null });
    addLog(`Loading completions for ${userHabitIds.length} habits on ${dateStr}...`, 'info', { component: 'completionStore.loadCompletions' });
    
    try {
      const result = await completionService.getCompletions(userHabitIds, date);
      
      if (result.success && result.data) {
        set({ 
          completions: result.data,
          loading: false,
          lastLoadedDate: dateStr,
          lastLoadedHabitIds: [...userHabitIds],
          loadedAt: Date.now()
        });
        
        addLog(`Loaded ${Object.keys(result.data).length} completions`, 'success', { component: 'completionStore.loadCompletions' });
      } else {
        set({ 
          error: result.error || 'Failed to load completions',
          loading: false
        });
        
        addLog(`Failed to load completions: ${result.error}`, 'error', { component: 'completionStore.loadCompletions' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      set({ 
        error: errorMessage,
        loading: false
      });
      
      addLog(`Error loading completions: ${errorMessage}`, 'error', { component: 'completionStore.loadCompletions' });
    }
  },
  
  toggleCompletion: async (habitId: string, date: Date, eventTime: string) => {
    const { addLog } = useDebugStore.getState();
    const dateStr = date.toISOString().split('T')[0];
    const completionKey = `${habitId}-${dateStr}-${eventTime}`;
    const isCurrentlyCompleted = get().completions[completionKey] || false;
    
    // First, optimistically update the UI
    set(state => ({
      completions: {
        ...state.completions,
        [completionKey]: !isCurrentlyCompleted
      }
    }));
    
    addLog(`${isCurrentlyCompleted ? 'Unmarking' : 'Marking'} habit ${habitId} as ${isCurrentlyCompleted ? 'incomplete' : 'complete'} for ${dateStr} at ${eventTime}...`, 'info', { component: 'completionStore.toggleCompletion' });
    
    try {
      // Call the appropriate service method based on the current state
      const result = isCurrentlyCompleted
        ? await completionService.markIncomplete(habitId, date, eventTime)
        : await completionService.markCompleted(habitId, date, eventTime);
      
      if (result.success) {
        addLog(`Successfully ${isCurrentlyCompleted ? 'unmarked' : 'marked'} habit as ${isCurrentlyCompleted ? 'incomplete' : 'complete'}`, 'success', { component: 'completionStore.toggleCompletion' });
        return true;
      } else {
        // Revert the optimistic update on failure
        set(state => ({
          completions: {
            ...state.completions,
            [completionKey]: isCurrentlyCompleted
          }
        }));
        
        addLog(`Failed to ${isCurrentlyCompleted ? 'unmark' : 'mark'} habit: ${result.error}`, 'error', { component: 'completionStore.toggleCompletion' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Revert the optimistic update on error
      set(state => ({
        completions: {
          ...state.completions,
          [completionKey]: isCurrentlyCompleted
        }
      }));
      
      addLog(`Error toggling completion: ${errorMessage}`, 'error', { component: 'completionStore.toggleCompletion' });
      return false;
    }
  },
  
  clearCompletions: () => {
    set({ 
      completions: {}, 
      error: null, 
      lastLoadedDate: null, 
      lastLoadedHabitIds: [],
      loadedAt: null
    });
    useDebugStore.getState().addLog('Cleared habit completions', 'info', { component: 'completionStore.clearCompletions' });
  },

  // Helper method to get completion status
  getCompletionStatus: (habitId: string, date: Date, eventTime: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const completionKey = `${habitId}-${dateStr}-${eventTime}`;
    return get().completions[completionKey] || false;
  }
}));
