export type HabitCategory = 'eat' | 'move' | 'mind' | 'sleep';
export type HabitContentType = 'pdf' | 'ppt' | 'image' | 'video' | 'link';
export type HabitFrequency = 
  | 'daily'
  | 'days_per_week'
  | 'times_per_week'
  | 'after_meals'
  | 'times_per_day'
  | 'specific_times';

export interface BottomLineItem {
  title: string;
  type: HabitContentType;
  url: string;
  description?: string;
}

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  mobile_number: string | null;
  mobile_country_code: string | null;
  preferred_weight_unit: 'kg' | 'lbs' | null;
  target_weight: number | null;
  goal_what: string | null;
  goal_why: string | null;
  goal_timeline: string | null;
  coaching_notes: string[];
  sex: 'male' | 'female' | null;
  created_at: string;
  updated_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  recorded_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitImage {
  id: string;
  habit_id: string;
  path: string;
  filename: string;
  size: number;
  created_at: string;
}

export interface HabitFrequencyDetails {
  // Daily
  daily?: {
    tracking?: {
      type: 'quantity' | 'duration' | 'boolean';
      unit?: string;
      target?: number;
    };
  };

  // Days per week
  days_per_week?: {
    days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
    tracking?: {
      type: 'quantity' | 'duration' | 'boolean';
      unit?: string;
      target?: number;
    };
  };

  // Times per week
  times_per_week?: {
    target: number;
    minimum_rest_days: number;
    sessions?: {
      name: string;
      duration_minutes?: number;
    }[];
  };

  // After meals
  after_meals?: {
    meals: ('breakfast' | 'lunch' | 'dinner')[];
    window: {
      minutes_after: number;
      duration_minutes: number;
    };
  };

  // Times per day
  times_per_day?: {
    target: number;
    minimum_interval_minutes: number;
    tracking?: {
      type: 'quantity';
      unit: string;
      target_per_time: number;
    };
  };

  // Specific times
  specific_times?: {
    times: string[]; // HH:mm format
    flexible_window_minutes: number;
  };
}

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  category: HabitCategory;
  content_type: HabitContentType | null;
  content_url: string | null;
  content_title: string | null;
  content_description: string | null;
  content_thumbnail_url: string | null;
  icon: string | null;
  bottom_line_items: BottomLineItem[];
  go_deeper_titles: string[];
  go_deeper_urls: string[];
  created_at: string;
  updated_at: string;
  images?: HabitImage[];
  frequency: HabitFrequency;
  frequency_details: HabitFrequencyDetails;
}

export interface DaySchedule {
  day: string;
  active: boolean;
  schedules: {
    event_time: string;
    reminder_time: string | null;
  }[];
}

export interface UserHabit {
  id: string;
  user_id: string;
  habit_id: string;
  frequency_per_day: number;
  daily_schedules: DaySchedule[];
  active: boolean;
  created_at: string;
  updated_at: string;
  habit?: Habit;
}

export interface HabitCompletion {
  id: string;
  user_habit_id: string;
  completed_at: string;
  date: string;
  event_time: string;
  reminder_time: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}