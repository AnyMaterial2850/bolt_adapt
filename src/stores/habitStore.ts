import { create } from 'zustand';
import { habitService } from '../services/habitService';
import type { Habit, UserHabit } from '../types/database';
import type { HabitFormData } from '../utils/types';
import { useDebugStore } from './debugStore';

// Helper function for array comparison (used for caching)
function arraysEqual(a: (Habit | UserHabit)[], b: (Habit | UserHabit)[]): boolean {
  if (a.length !== b.length) return false;
  const aIds = a.map(item => item.id).sort();
  const bIds = b.map(item => item.id).sort();
  return aIds.every((id, idx) => id === bIds[idx]);
}

interface HabitState {
  // All habits
  habits: Habit[];
  loadingHabits: boolean;
  habitsError: string | null;
  habitsLoadedAt: number | null;
  
  // User habits
  userHabits: UserHabit[];
  loadingUserHabits: boolean;
  userHabitsError: string | null;
  lastLoadedUserId: string | null;
  userHabitsLoadedAt: number | null;
  
  // Selected habit for editing
  selectedHabit: Habit | null;
  loadingSelectedHabit: boolean;
  selectedHabitError: string | null;
  lastLoadedHabitId: string | null;
  selectedHabitLoadedAt: number | null;
  
  // Selected targets for habits
  selectedTargets: Record<string, number>;
  
  // Toast notification
  toast: { message: string; type: 'success' | 'error' } | null;
  
  // Actions
  loadHabits: () => Promise<void>;
  loadUserHabits: (userId: string) => Promise<void>;
  loadHabitById: (id: string) => Promise<void>;
  createHabit: (formData: HabitFormData, userId: string) => Promise<boolean>;
  updateHabit: (id: string, formData: HabitFormData) => Promise<boolean>;
  deleteHabit: (id: string) => Promise<boolean>;
  addHabitToUser: (userId: string, habitId: string) => Promise<boolean>;
  removeHabitFromUser: (userId: string, habitId: string, userHabitId?: string) => Promise<boolean>;
  toggleHabitActive: (userHabitId: string, active: boolean) => Promise<boolean>;
  clearSelectedHabit: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  setSelectedTarget: (habitId: string, target: number) => void;
  
  // Helper methods for checking if data needs to be reloaded
  shouldReloadHabits: () => boolean;
  shouldReloadUserHabits: (userId: string) => boolean;
  shouldReloadHabitById: (id: string) => boolean;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  // State
  habits: [],
  loadingHabits: false,
  habitsError: null,
  habitsLoadedAt: null,
  
  userHabits: [],
  loadingUserHabits: false,
  userHabitsError: null,
  lastLoadedUserId: null,
  userHabitsLoadedAt: null,
  
  selectedHabit: null,
  loadingSelectedHabit: false,
  selectedHabitError: null,
  lastLoadedHabitId: null,
  selectedHabitLoadedAt: null,
  
  selectedTargets: {},
  
  toast: null,
  
  // Helper methods
  shouldReloadHabits: () => {
    const { habitsLoadedAt, loadingHabits } = get();
    
    // Don't reload if already loading
    if (loadingHabits) return false;
    
    // Reload if never loaded before
    if (habitsLoadedAt === null) return true;
    
    // Reload if data is stale (older than 5 minutes)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - habitsLoadedAt > fiveMinutes;
  },
  
  shouldReloadUserHabits: (userId: string) => {
    const { userHabitsLoadedAt, loadingUserHabits, lastLoadedUserId } = get();
    
    // Don't reload if already loading
    if (loadingUserHabits) return false;
    
    // Reload if never loaded before
    if (userHabitsLoadedAt === null) return true;
    
    // Reload if user ID changed
    if (lastLoadedUserId !== userId) return true;
    
    // Reload if data is stale (older than 2 minutes)
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    return now - userHabitsLoadedAt > twoMinutes;
  },
  
  shouldReloadHabitById: (id: string) => {
    const { selectedHabitLoadedAt, loadingSelectedHabit, lastLoadedHabitId } = get();
    
    // Don't reload if already loading
    if (loadingSelectedHabit) return false;
    
    // Reload if never loaded before
    if (selectedHabitLoadedAt === null) return true;
    
    // Reload if habit ID changed
    if (lastLoadedHabitId !== id) return true;
    
    // Reload if data is stale (older than 5 minutes)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - selectedHabitLoadedAt > fiveMinutes;
  },
  
  // Actions
  loadHabits: async () => {
    const { addLog } = useDebugStore.getState();
    
    // Check if we need to reload
    if (!get().shouldReloadHabits()) {
      addLog('Skipping habit reload - data is fresh', 'info', { component: 'habitStore.loadHabits' });
      return;
    }
    
    addLog('Loading all habits...', 'info', { component: 'habitStore.loadHabits' });
    
    set({ loadingHabits: true, habitsError: null });
    
    const result = await habitService.getAllHabits();
    
    if (result.success && result.data) {
      set({
        habits: result.data,
        loadingHabits: false,
        habitsLoadedAt: Date.now()
      });
      addLog(`Loaded ${result.data.length} habits`, 'success', { component: 'habitStore.loadHabits' });
    } else {
      set({
        habitsError: result.error || 'Failed to load habits',
        loadingHabits: false
      });
      addLog(`Failed to load habits: ${result.error}`, 'error', { component: 'habitStore.loadHabits' });
    }
  },
  
  loadUserHabits: async (userId: string) => {
    const { addLog } = useDebugStore.getState();
    
    // Check if we need to reload
    if (!get().shouldReloadUserHabits(userId)) {
      addLog(`Skipping user habits reload for user ${userId} - data is fresh`, 'info', { component: 'habitStore.loadUserHabits' });
      return;
    }
    
    addLog(`Loading habits for user ${userId}...`, 'info', { component: 'habitStore.loadUserHabits' });
    
    set({ loadingUserHabits: true, userHabitsError: null });
    
    const result = await habitService.getUserHabits(userId);
    
    if (result.success && result.data) {
      set({
        userHabits: result.data,
        loadingUserHabits: false,
        lastLoadedUserId: userId,
        userHabitsLoadedAt: Date.now()
      });
      addLog(`Loaded ${result.data.length} user habits`, 'success', { component: 'habitStore.loadUserHabits' });
    } else {
      set({
        userHabitsError: result.error || 'Failed to load user habits',
        loadingUserHabits: false
      });
      addLog(`Failed to load user habits: ${result.error}`, 'error', { component: 'habitStore.loadUserHabits' });
    }
  },
  
  loadHabitById: async (id: string) => {
    const { addLog } = useDebugStore.getState();
    
    // Check if we need to reload
    if (!get().shouldReloadHabitById(id)) {
      addLog(`Skipping habit reload for ID ${id} - data is fresh`, 'info', { component: 'habitStore.loadHabitById' });
      return;
    }
    
    addLog(`Loading habit with ID ${id}...`, 'info', { component: 'habitStore.loadHabitById' });
    
    set({ loadingSelectedHabit: true, selectedHabitError: null });
    
    const result = await habitService.getHabitById(id);
    
    if (result.success && result.data) {
      set({
        selectedHabit: result.data,
        loadingSelectedHabit: false,
        lastLoadedHabitId: id,
        selectedHabitLoadedAt: Date.now()
      });
      addLog(`Loaded habit: ${result.data.title}`, 'success', { component: 'habitStore.loadHabitById' });
    } else {
      set({
        selectedHabitError: result.error || `Failed to load habit with ID ${id}`,
        loadingSelectedHabit: false
      });
      addLog(`Failed to load habit: ${result.error}`, 'error', { component: 'habitStore.loadHabitById' });
    }
  },
  
  createHabit: async (formData: HabitFormData, userId: string) => {
    const { addLog } = useDebugStore.getState();
    addLog('Creating new habit...', 'info', { component: 'habitStore.createHabit' });
    
    const result = await habitService.createHabit(formData, userId);
    
    if (result.success && result.data) {
      // Update habits list with new habit
      set(state => ({
        habits: [result.data!, ...state.habits],
        habitsLoadedAt: Date.now() // Update loaded timestamp
      }));
      
      addLog(`Created habit: ${result.data.title}`, 'success', { component: 'habitStore.createHabit' });
      return true;
    } else {
      set({
        toast: { message: result.error || 'Failed to create habit', type: 'error' }
      });
      
      addLog(`Failed to create habit: ${result.error}`, 'error', { component: 'habitStore.createHabit' });
      return false;
    }
  },
  
  updateHabit: async (id: string, formData: HabitFormData) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Updating habit with ID ${id}...`, 'info', { component: 'habitStore.updateHabit' });
    
    const result = await habitService.updateHabit(id, formData);
    
    if (result.success && result.data) {
      // Update habits list with updated habit
      set(state => ({
        habits: state.habits.map(h => h.id === id ? result.data! : h),
        selectedHabit: result.data,
        lastLoadedHabitId: id,
        selectedHabitLoadedAt: Date.now(), // Update loaded timestamp
        habitsLoadedAt: Date.now() // Update all habits loaded timestamp
      }));
      
      addLog(`Updated habit: ${result.data.title}`, 'success', { component: 'habitStore.updateHabit' });
      return true;
    } else {
      set({
        toast: { message: result.error || 'Failed to update habit', type: 'error' }
      });
      
      addLog(`Failed to update habit: ${result.error}`, 'error', { component: 'habitStore.updateHabit' });
      return false;
    }
  },
  
  deleteHabit: async (id: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Deleting habit with ID ${id}...`, 'info', { component: 'habitStore.deleteHabit' });
    
    const result = await habitService.deleteHabit(id);
    
    if (result.success) {
      // Remove habit from habits list
      set(state => ({
        habits: state.habits.filter(h => h.id !== id),
        habitsLoadedAt: Date.now() // Update loaded timestamp
      }));
      
      addLog(`Deleted habit with ID ${id}`, 'success', { component: 'habitStore.deleteHabit' });
      return true;
    } else {
      set({
        toast: { message: result.error || 'Failed to delete habit', type: 'error' }
      });
      
      addLog(`Failed to delete habit: ${result.error}`, 'error', { component: 'habitStore.deleteHabit' });
      return false;
    }
  },
  
  addHabitToUser: async (userId: string, habitId: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Adding habit ${habitId} to user ${userId}...`, 'info', { component: 'habitStore.addHabitToUser' });
    
    const result = await habitService.addHabitToUser(userId, habitId);
    
    if (result.success && result.data) {
      // Add user habit to user habits list
      set(state => ({
        userHabits: [...state.userHabits, result.data!],
        userHabitsLoadedAt: Date.now() // Update loaded timestamp
      }));
      
      addLog(`Added habit ${habitId} to user ${userId}`, 'success', { component: 'habitStore.addHabitToUser' });
      return true;
    } else {
      set({
        toast: { message: result.error || 'Failed to add habit', type: 'error' }
      });
      
      addLog(`Failed to add habit to user: ${result.error}`, 'error', { component: 'habitStore.addHabitToUser' });
      return false;
    }
  },
  
  removeHabitFromUser: async (userId: string, habitId: string, userHabitId?: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Deactivating habit ${habitId} for user ${userId}...`, 'info', { component: 'habitStore.removeHabitFromUser' });
    
    // 1. Optimistically update UI to mark the habit as inactive (not remove it)
    set(state => ({
      userHabits: state.userHabits.map(uh => 
        uh.habit_id === habitId ? { ...uh, active: false } : uh
      )
    }));

    // 2. Then perform the update to set active=false
    const result = await habitService.removeHabitFromUser(userId, habitId, userHabitId);

    // 3. Only revert if failed
    if (!result.success) {
      // Revert optimistic update
      const revertResult = await habitService.getUserHabits(userId);
      
      set(state => ({
        userHabits: revertResult.data || [],
        toast: { message: result.error || 'Failed to deactivate habit', type: 'error' }
      }));
      
      addLog(`Failed to deactivate habit for user: ${result.error}`, 'error', { component: 'habitStore.removeHabitFromUser' });
      return false;
    } else {
      // Update timestamp on success
      set({ userHabitsLoadedAt: Date.now() });
    }

    addLog(`Deactivated habit ${habitId} for user ${userId}`, 'success', { component: 'habitStore.removeHabitFromUser' });
    return true;
  },
  
  toggleHabitActive: async (userHabitId: string, active: boolean) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Toggling habit ${userHabitId} active status to ${active}...`, 'info', { component: 'habitStore.toggleHabitActive' });
    
    // Optimistically update UI
    set(state => ({
      userHabits: state.userHabits.map(uh => 
        uh.id === userHabitId ? { ...uh, active } : uh
      )
    }));
    
    const result = await habitService.toggleHabitActive(userHabitId, active);
    
    if (result.success) {
      // Update timestamp on success
      set({ userHabitsLoadedAt: Date.now() });
      
      addLog(`Toggled habit ${userHabitId} active status to ${active}`, 'success', { component: 'habitStore.toggleHabitActive' });
      return true;
    } else {
      // Revert optimistic update
      set(state => ({
        userHabits: state.userHabits.map(uh => 
          uh.id === userHabitId ? { ...uh, active: !active } : uh
        ),
        toast: { message: result.error || 'Failed to update habit status', type: 'error' }
      }));
      
      addLog(`Failed to toggle habit active status: ${result.error}`, 'error', { component: 'habitStore.toggleHabitActive' });
      return false;
    }
  },
  
  clearSelectedHabit: () => {
    set({
      selectedHabit: null,
      selectedHabitError: null,
      lastLoadedHabitId: null,
      selectedHabitLoadedAt: null
    });
  },
  
  setToast: (toast) => {
    set({ toast });
  },
  
  setSelectedTarget: (habitId: string, target: number) => {
    const { addLog } = useDebugStore.getState();
    const currentState = get();
    const current = currentState.selectedTargets[habitId];

    if (current === target) {
      addLog(`Skipping update: target for habit ${habitId} already ${target}`, 'debug', { component: 'habitStore.setSelectedTarget' });
      return;
    }

    addLog(`Setting selected target for habit ${habitId} to ${target}`, 'info', { component: 'habitStore.setSelectedTarget' });
    addLog(`Updating target for habit ${habitId} from ${current} to ${target}`, 'debug', { component: 'habitStore.setSelectedTarget' });

    set(state => ({
      selectedTargets: {
        ...state.selectedTargets,
        [habitId]: target
      }
    }));
  }
}));
