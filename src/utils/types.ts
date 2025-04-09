import type { 
  HabitCategory, 
  HabitContentType, 
  BottomLineItem, 
  HabitFrequency,
  Habit
} from '../types/database';

/**
 * Form data structure for creating or updating a habit
 */
export interface HabitFormData {
  title: string;
  description: string;
  category: HabitCategory;
  icon: string | null;
  content_type: HabitContentType | null;
  content_url: string;
  content_title: string;
  content_description: string;
  content_thumbnail_url: string;
  bottom_line_items: BottomLineItem[];
  go_deeper_titles: string[];
  go_deeper_urls: string[];
  frequency: HabitFrequency;
  frequency_details: any; // Using 'any' for simplicity
  target?: (number | '')[];  // array of numbers or empty string during editing
  unit?: string | null;
}

/**
 * Result of a service operation
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
