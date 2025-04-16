import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { HabitItem } from './HabitItem';
import type { Habit, HabitCategory, UserHabit } from '../../types/database';
import { cn } from '../../lib/utils';

interface HabitListProps {
  habits: Habit[];
  userHabits: UserHabit[];
  category: HabitCategory;
  onAddOrRemoveHabit: (habit: Habit, isSelected: boolean, userHabitId?: string) => void;
  onAddHabit: () => void;
  onSelectTarget: (habitId: string, target: number) => void;
  selectedTargets: Record<string, number>;
}

export function HabitList({ 
  habits, 
  userHabits, 
  category, 
  onAddOrRemoveHabit,
  onAddHabit,
  onSelectTarget,
  selectedTargets
}: HabitListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter habits by category and search term
  const filteredHabits = useMemo(() => {
    return habits.filter(habit => 
      habit.category === category &&
      habit.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [habits, category, searchTerm]);

  // Determine if a habit is selected
  const isHabitSelected = (habit: Habit) => {
    return userHabits.some(uh => uh.habit_id === habit.id);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="px-4">
        <input 
          type="text" 
          placeholder={`Search ${category} habits`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Add Habit Button */}
      <button 
        onClick={onAddHabit}
        className="w-full flex items-center justify-center px-4 py-3 bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors rounded-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New {category.charAt(0).toUpperCase() + category.slice(1)} Habit
      </button>

      {/* Habits List */}
      <div className="space-y-3 px-4">
        {filteredHabits.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No habits found in this category
          </div>
        ) : (
          filteredHabits.map(habit => (
            <HabitItem 
              key={habit.id}
              habit={habit}
              isSelected={isHabitSelected(habit)}
              onSelect={onAddOrRemoveHabit}
              userHabits={userHabits}
              selectedTargets={selectedTargets}
            />
          ))
        )}
      </div>
    </div>
  );
}
