import type { Habit, BottomLineItem } from '../types/database';
import type { HabitFormData } from './types';

export const habitDataProcessor = {
  /**
   * Process form data for creating or updating a habit
   * @param formData The raw form data
   * @returns Processed data ready for database insertion/update
   */
  processFormData: (formData: HabitFormData): Partial<Habit> => {
    // Filter go deeper items to remove empty entries
    const filteredGoDeeper = formData.go_deeper_titles
      .map((title: string, index: number) => ({
        title,
        url: formData.go_deeper_urls[index] || '',
      }))
      .filter((item: { title: string; url: string }) => item.title && item.url);
      
    // Filter bottom line items to remove invalid entries
    const validBottomLineItems = formData.bottom_line_items
      .filter((item: BottomLineItem) => item.type && item.url);
      
    // Return processed data
    return {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      icon: formData.icon || null,
      content_type: formData.content_type,
      content_url: formData.content_url || null,
      content_title: formData.content_title || null,
      content_description: formData.content_description || null,
      content_thumbnail_url: formData.content_thumbnail_url || null,
      bottom_line_items: validBottomLineItems,
      go_deeper_titles: filteredGoDeeper.map((item: { title: string; url: string }) => item.title),
      go_deeper_urls: filteredGoDeeper.map((item: { title: string; url: string }) => item.url),
      frequency: formData.frequency,
      frequency_details: formData.frequency_details,
      // Handle target field - if empty array, omit it from the update data
      // Only include non-empty arrays of valid numbers
      ...(Array.isArray(formData.target) ? (() => {
        const validTargets = formData.target
          .filter(t => t !== null && t !== undefined && t !== '' && !isNaN(Number(t)))
          .map(t => Number(t));
        
        // Only include target if it has valid values
        return validTargets.length > 0
          ? { target: validTargets } // Native JS array
          : {};
      })() : {}),
      // Handle unit field - if empty string, set to null
      unit: formData.unit && formData.unit.trim() !== '' ? formData.unit : null
    };
  },
  
  /**
   * Validate a habit form data object
   * @param formData The form data to validate
   * @returns An object with validation result and any error messages
   */
  validateFormData: (formData: HabitFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Required fields
    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!formData.category) {
      errors.push('Category is required');
    }
    
    if (!formData.frequency) {
      errors.push('Frequency is required');
    }
    
    // Validate bottom line items if any exist
    formData.bottom_line_items.forEach((item: BottomLineItem, index: number) => {
      const isEmpty = (!item.title || item.title.trim() === '') && (!item.url || item.url.trim() === '');
      if (isEmpty) {
        // Skip validation for empty optional items
        return;
      }

      if (item.type && !item.url) {
        errors.push(`Bottom line item #${index + 1} is missing a URL`);
      }
      
      if (item.url && !item.title) {
        errors.push(`Bottom line item #${index + 1} is missing a title`);
      }
    });
    
    // Validate go deeper items if any exist
    formData.go_deeper_titles.forEach((title: string, index: number) => {
      if (title && !formData.go_deeper_urls[index]) {
        errors.push(`Go deeper item #${index + 1} is missing a URL`);
      }
      
      if (formData.go_deeper_urls[index] && !title) {
        errors.push(`Go deeper item #${index + 1} is missing a title`);
      }
    });
    
    // Validate target values if any exist
    if (formData.target && formData.target.length > 0) {
      formData.target.forEach((target, index) => {
        if (target === null || target === undefined || isNaN(Number(target))) {
          errors.push(`Target value #${index + 1} is not a valid number`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Format a habit object for display in the UI
   * @param habit The habit object from the database
   * @returns A formatted habit object for UI display
   */
  formatHabitForDisplay: (habit: Habit): Habit => {
    // Ensure arrays exist even if null in database
    return {
      ...habit,
      bottom_line_items: habit.bottom_line_items || [],
      go_deeper_titles: habit.go_deeper_titles || [],
      go_deeper_urls: habit.go_deeper_urls || [],
      target: habit.target || [],
    };
  }
};
