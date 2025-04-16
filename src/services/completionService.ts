import { supabase } from '../lib/supabase';
import { errorService } from './errorService';
import { format, startOfDay, isFuture } from 'date-fns';
import type { ServiceResult } from '../utils/types';

export const completionService = {
  /**
   * Get completions for a user's habits on a specific date
   * @param userHabitIds The IDs of the user's habits
   * @param date The date to get completions for
   * @param forceReload Whether to bypass any potential caching
   * @returns A map of completion keys to completion status
   */
  getCompletions: async (
    userHabitIds: string[], 
    date: Date,
    forceReload: boolean = false
  ): Promise<ServiceResult<Record<string, boolean>>> => {
    try {
      if (userHabitIds.length === 0) {
        return { success: true, data: {} };
      }
      
      // Format date for query
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Get completions from Supabase
      const { data, error } = await supabase
        .from('habit_comp_track')
        .select('*')
        .eq('date', dateStr)
        .in('user_habit_id', userHabitIds);
        
      if (error) throw error;
      
      // Create a map of completions
      const completionsMap: Record<string, boolean> = {};
      data?.forEach(completion => {
        // Check if this is a sub-event (format: HH:MM-index)
        if (completion.evt_time.includes('-')) {
          // For sub-events, use the original format
          const key = `${completion.user_habit_id}-${completion.date}-${completion.evt_time}`;
          completionsMap[key] = true;
        } else {
          // Format evt_time to match the format used in the UI (HH:mm)
          const timeStr = completion.evt_time.split(' ')[0]; // Extract time part before AM/PM
          const [hours, minutes] = timeStr.split(':');
          const formattedTime = `${hours.padStart(2, '0')}:${minutes}`;
          
          const key = `${completion.user_habit_id}-${completion.date}-${formattedTime}`;
          completionsMap[key] = true;
        }
      });
      
      return { success: true, data: completionsMap };
    } catch (error) {
      const result = errorService.handleError(error, 'Failed to load habit completions', {
        component: 'completionService.getCompletions'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Mark a habit as completed
   * @param habitId The user habit ID
   * @param date The date of completion
   * @param eventTime The time of completion (HH:MM format or HH:MM-index for sub-events)
   * @returns Success status
   */
  markCompleted: async (
    habitId: string, 
    date: Date, 
    eventTime: string
  ): Promise<ServiceResult> => {
    try {
      // Check if the date is in the future
      if (isFuture(startOfDay(date))) {
        return { 
          success: false, 
          error: "You can't track habits for future dates" 
        };
      }
      
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Handle sub-events (format: HH:MM-index)
      let formattedTime: string;
      if (eventTime.includes('-')) {
        // For sub-events, we keep the original format to distinguish between different sub-events
        formattedTime = eventTime;
      } else {
        formattedTime = formatToSupabaseTime(eventTime);
      }
      
      // First try to delete any existing completion for this habit and date
      await supabase
        .from('habit_comp_track')
        .delete()
        .eq('user_habit_id', habitId)
        .eq('date', dateStr)
        .eq('evt_time', formattedTime);

      // Insert new completion
      const { error } = await supabase
        .from('habit_comp_track')
        .insert([{
          user_habit_id: habitId,
          date: dateStr,
          evt_time: formattedTime,
          completed_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      const result = errorService.handleError(error, 'Failed to mark habit as completed', {
        component: 'completionService.markCompleted'
      });
      return { success: false, error: result.message };
    }
  },
  
  /**
   * Mark a habit as incomplete
   * @param habitId The user habit ID
   * @param date The date of completion
   * @param eventTime The time of completion (HH:MM format or HH:MM-index for sub-events)
   * @returns Success status
   */
  markIncomplete: async (
    habitId: string, 
    date: Date, 
    eventTime: string
  ): Promise<ServiceResult> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Handle sub-events (format: HH:MM-index)
      let formattedTime: string;
      if (eventTime.includes('-')) {
        // For sub-events, we keep the original format to distinguish between different sub-events
        formattedTime = eventTime;
      } else {
        formattedTime = formatToSupabaseTime(eventTime);
      }
      
      // Delete the completion
      const { error } = await supabase
        .from('habit_comp_track')
        .delete()
        .eq('user_habit_id', habitId)
        .eq('date', dateStr)
        .eq('evt_time', formattedTime);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      const result = errorService.handleError(error, 'Failed to mark habit as incomplete', {
        component: 'completionService.markIncomplete'
      });
      return { success: false, error: result.message };
    }
  }
};

/**
 * Format a time string to the format used by Supabase
 * @param timeString Time string in HH:MM format
 * @returns Time string in the format used by Supabase
 */
function formatToSupabaseTime(timeString: string): string {
  // Convert 24-hour format to 12-hour format for storage
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
