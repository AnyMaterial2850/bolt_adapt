import { supabase } from '../lib/supabase';
import { errorService } from './errorService';
import { habitDataProcessor } from '../utils/habitDataProcessor';
import type { Habit, UserHabit } from '../types/database';
import type { HabitFormData, ServiceResult } from '../utils/types';

export const habitService = {
  /**
   * Get all habits
   * @returns A list of all habits
   */
  getAllHabits: async (): Promise<ServiceResult<Habit[]>> => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Ensure data is an array and not null
      const processedData = (data || []).map(habit => 
        habitDataProcessor.formatHabitForDisplay(habit)
      );
      
      return { 
        success: true, 
        data: processedData
      };
    } catch (error) {
      const result = errorService.handleError(error, 'Failed to load habits', {
        component: 'habitService.getAllHabits'
      });
      console.error('Habit loading error:', result.message);
      return { success: true, data: [] }; // Return empty array instead of error
    }
  },
  
  /**
   * Get a single habit by ID
   * @param id The habit ID
   * @returns The habit object
   */
  getHabitById: async (id: string): Promise<ServiceResult<Habit>> => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error(`Habit with ID ${id} not found`);
      
      return { 
        success: true, 
        data: habitDataProcessor.formatHabitForDisplay(data)
      };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to load habit with ID ${id}`, {
        component: 'habitService.getHabitById'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Create a new habit
   * @param formData The habit form data
   * @param userId The ID of the user creating the habit
   * @returns The created habit
   */
  createHabit: async (formData: HabitFormData, userId: string): Promise<ServiceResult<Habit>> => {
    try {
      // Validate form data
      const validation = habitDataProcessor.validateFormData(formData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: validation.errors.join(', ')
        };
      }
      
      // Process form data
      const habitData = habitDataProcessor.processFormData(formData);
      
      // Add owner_id
      const dataWithOwner = {
        ...habitData,
        owner_id: userId
      };

      console.log('CREATE habit payload:', JSON.stringify(dataWithOwner, null, 2));
      
      // Create habit
      const { data, error } = await supabase
        .from('habits')
        .insert([dataWithOwner])
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to create habit: No data returned');
      
      return { 
        success: true, 
        data: habitDataProcessor.formatHabitForDisplay(data)
      };
    } catch (error) {
      const result = errorService.handleError(error, 'Failed to create habit', {
        component: 'habitService.createHabit'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Update an existing habit
   * @param id The habit ID
   * @param formData The habit form data
   * @returns The updated habit
   */
  updateHabit: async (id: string, formData: HabitFormData): Promise<ServiceResult<Habit>> => {
    try {
      // Validate form data
      const validation = habitDataProcessor.validateFormData(formData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: validation.errors.join(', ')
        };
      }
      
      // Process form data
      const habitData = habitDataProcessor.processFormData(formData);
      
      // Log the data being sent to the database for debugging
      console.log('UPDATE habit payload:', JSON.stringify(habitData, null, 2));
      
      // Update habit
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', id)
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .single();
        
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      if (!data) throw new Error(`Failed to update habit with ID ${id}: No data returned`);
      
      return { 
        success: true, 
        data: habitDataProcessor.formatHabitForDisplay(data)
      };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to update habit with ID ${id}`, {
        component: 'habitService.updateHabit'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Delete a habit
   * @param id The habit ID
   * @returns Success status
   */
  deleteHabit: async (id: string): Promise<ServiceResult> => {
    try {
      // First get the habit to check for images
      const { data: habit, error: getError } = await supabase
        .from('habits')
        .select(`
          *,
          habit_images (
            id,
            path
          )
        `)
        .eq('id', id)
        .single();
        
      if (getError) throw getError;
      
      // Delete associated images from storage if they exist
      if (habit?.habit_images?.length) {
        for (const image of habit.habit_images) {
          const { error: deleteImageError } = await supabase.storage
            .from('habits')
            .remove([image.path]);
            
          if (deleteImageError) {
            console.error(`Failed to delete image ${image.path}:`, deleteImageError);
          }
        }
      }
      
      // Delete the habit
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      return { success: true };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to delete habit with ID ${id}`, {
        component: 'habitService.deleteHabit'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Get habits for a specific user
   * @param userId The user ID
   * @returns The user's habits
   */
  getUserHabits: async (userId: string): Promise<ServiceResult<UserHabit[]>> => {
    try {
      const { data, error } = await supabase
        .from('user_habits')
        .select('*, habit:habits(*)')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Deduplicate user habits by habit_id
      const uniqueUserHabits = data ? 
        Array.from(new Map(data.map(uh => [uh.habit_id, uh])).values()) : 
        [];
      
      return { success: true, data: uniqueUserHabits };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to load habits for user ${userId}`, {
        component: 'habitService.getUserHabits'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Add a habit to a user's list
   * @param userId The user ID
   * @param habitId The habit ID
   * @returns The created user habit
   */
  addHabitToUser: async (userId: string, habitId: string): Promise<ServiceResult<UserHabit>> => {
    try {
      // Create default daily schedules
      const defaultSchedules = [
        { day: 'Mon', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Tue', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Wed', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Thu', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Fri', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Sat', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
        { day: 'Sun', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] }
      ];
      
      // Add habit to user
      const { data, error } = await supabase
        .from('user_habits')
        .insert({
          user_id: userId,
          habit_id: habitId,
          active: true,
          daily_schedules: defaultSchedules,
        })
        .select('*, habit:habits(*)')
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Failed to add habit to user: No data returned');
      
      return { success: true, data };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to add habit ${habitId} to user ${userId}`, {
        component: 'habitService.addHabitToUser'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Remove a habit from a user's list
   * @param userId The user ID
   * @param habitId The habit ID
   * @returns Success status
   */
  removeHabitFromUser: async (userId: string, habitId: string, userHabitId?: string): Promise<ServiceResult> => {
    try {
      let recordToDelete: { id: string } | null = null;

      // If userHabitId is provided, use it directly
      if (userHabitId) {
        recordToDelete = { id: userHabitId };
      } else {
        // Otherwise, find the specific user_habit record to delete
        const { data, error: findError } = await supabase
          .from('user_habits')
          .select('id')
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .single();

        if (findError) {
          console.error('Error finding user habit:', findError);
          throw findError;
        }

        recordToDelete = data;
      }

      if (!recordToDelete) {
        console.warn(`No user habit found for user ${userId} and habit ${habitId}`);
        return { success: true, data: null }; // Return null data to differentiate from error
      }

      // Delete the specific user_habit record
      const { error, data: deletedData } = await supabase
        .from('user_habits')
        .delete()
        .eq('id', recordToDelete.id)
        .select();
        
      if (error) throw error;
      
      return { 
        success: true, 
        data: deletedData ? deletedData[0] : null 
      };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to remove habit ${habitId} from user ${userId}`, {
        component: 'habitService.removeHabitFromUser'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Toggle a habit's active status for a user
   * @param userHabitId The user habit ID
   * @param active The new active status
   * @returns Success status
   */
  toggleHabitActive: async (userHabitId: string, active: boolean): Promise<ServiceResult> => {
    try {
      const { error } = await supabase
        .from('user_habits')
        .update({ active })
        .eq('id', userHabitId);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      const result = errorService.handleError(error, `Failed to toggle habit ${userHabitId} active status`, {
        component: 'habitService.toggleHabitActive'
      });
      return { success: false, error: result.message };
    }
  }
};
