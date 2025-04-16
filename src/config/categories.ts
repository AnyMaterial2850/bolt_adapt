export type HabitCategory = 'eat' | 'move' | 'mind' | 'sleep';

export const HABIT_CATEGORIES: Record<HabitCategory, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  eat: {
    label: 'Eat',
    description: 'Nourish your body with healthy choices',
    color: 'eat',
    icon: 'mdi:food-apple'
  },
  move: {
    label: 'Move',
    description: 'Stay active and energetic',
    color: 'move',
    icon: 'mdi:run'
  },
  mind: {
    label: 'Mind',
    description: 'Cultivate mental well-being',
    color: 'mind',
    icon: 'mdi:brain'
  },
  sleep: {
    label: 'Sleep',
    description: 'Restore and recharge',
    color: 'sleep',
    icon: 'mdi:sleep'
  }
};

export const getCategoryColor = (category: HabitCategory): string => 
  HABIT_CATEGORIES[category].color;

export const getCategoryIcon = (category: HabitCategory): string => 
  HABIT_CATEGORIES[category].icon;

export const CATEGORY_CONFIG = HABIT_CATEGORIES;
