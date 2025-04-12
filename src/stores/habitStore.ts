import { create } from 'zustand';
import { habitService } from '../services/habitService';
import type { Habit, UserHabit } from '../types/database';
import type { HabitFormData } from '../utils/types';
import { useDebugStore } from './debugStore';

interface HabitState {
  // All habits
  habits: Habit[];
  loadingHabits: boolean;
  habitsError: string | null;
  
  // User habits
  userHabits: UserHabit[];
  loadingUserHabits: boolean;
  userHabitsError: string | null;
  
  // Selected habit for editing
  selectedHabit: Habit | null;
  loadingSelectedHabit: boolean;
  selectedHabitError: string | null;
  
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
  removeHabitFromUser: (userId: string, habitId: string) => Promise<boolean>;
  toggleHabitActive: (userHabitId: string, active: boolean) => Promise<boolean>;
  clearSelectedHabit: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  setSelectedTarget: (habitId: string, target: number) => void;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  // State
  habits: [],
  loadingHabits: false,
  habitsError: null,
  
  userHabits: [],
  loadingUserHabits: false,
  userHabitsError: null,
  
  selectedHabit: null,
  loadingSelectedHabit: false,
  selectedHabitError: null,
  
  selectedTargets: {},
  
  toast: null,
  
  // Actions
  loadHabits: async () => {
    const { addLog } = useDebugStore.getState();
    addLog('Loading all habits...', 'info', { component: 'habitStore.loadHabits' });
    
    set({ loadingHabits: true, habitsError: null });
    
    const result = await habitService.getAllHabits();
    
    if (result.success && result.data) {
      set({ habits: result.data, loadingHabits: false });
      addLog(`Loaded ${result.data.length} habits`, 'success', { component: 'habitStore.loadHabits' });
    } else {
      set({ habitsError: result.error || 'Failed to load habits', loadingHabits: false });
      addLog(`Failed to load habits: ${result.error}`, 'error', { component: 'habitStore.loadHabits' });
    }
  },
  
  loadUserHabits: async (userId: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Loading habits for user ${userId}...`, 'info', { component: 'habitStore.loadUserHabits' });
    
    set({ loadingUserHabits: true, userHabitsError: null });
    
    const result = await habitService.getUserHabits(userId);
    
    if (result.success && result.data) {
      set({ userHabits: result.data, loadingUserHabits: false });
      addLog(`Loaded ${result.data.length} user habits`, 'success', { component: 'habitStore.loadUserHabits' });
    } else {
      set({ userHabitsError: result.error || 'Failed to load user habits', loadingUserHabits: false });
      addLog(`Failed to load user habits: ${result.error}`, 'error', { component: 'habitStore.loadUserHabits' });
    }
  },
  
  loadHabitById: async (id: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Loading habit with ID ${id}...`, 'info', { component: 'habitStore.loadHabitById' });
    
    set({ loadingSelectedHabit: true, selectedHabitError: null });
    
    const result = await habitService.getHabitById(id);
    
    if (result.success && result.data) {
      set({ selectedHabit: result.data, loadingSelectedHabit: false });
      addLog(`Loaded habit: ${result.data.title}`, 'success', { component: 'habitStore.loadHabitById' });
    } else {
      set({ selectedHabitError: result.error || `Failed to load habit with ID ${id}`, loadingSelectedHabit: false });
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
        toast: { message: 'Habit created successfully', type: 'success' }
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
        toast: { message: 'Habit updated successfully', type: 'success' }
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
        toast: { message: 'Habit deleted successfully', type: 'success' }
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
        toast: { message: 'Habit added to your list', type: 'success' }
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
  
  removeHabitFromUser: async (userId: string, habitId: string) => {
    const { addLog } = useDebugStore.getState();
    addLog(`Removing habit ${habitId} from user ${userId}...`, 'info', { component: 'habitStore.removeHabitFromUser' });
    
    const result = await habitService.removeHabitFromUser(userId, habitId);
    
    if (result.success) {
      // Remove user habit from user habits list
      set(state => ({ 
        userHabits: state.userHabits.filter(uh => uh.habit_id !== habitId),
        toast: { message: 'Habit removed from your list', type: 'success' }
      }));
      
      addLog(`Removed habit ${habitId} from user ${userId}`, 'success', { component: 'habitStore.removeHabitFromUser' });
      return true;
    } else {
      set({ 
        toast: { message: result.error || 'Failed to remove habit', type: 'error' }
      });
      
      addLog(`Failed to remove habit from user: ${result.error}`, 'error', { component: 'habitStore.removeHabitFromUser' });
      return false;
    }
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
    set({ selectedHabit: null, selectedHabitError: null });
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
