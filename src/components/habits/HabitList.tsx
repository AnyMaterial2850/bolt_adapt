import { Plus } from 'lucide-react';
import { HabitItem } from './HabitItem';
import { CreateHabitModal } from './CreateHabitModal';
import type { Habit, UserHabit, HabitCategory } from '../../types/database';
import { useState, useMemo } from 'react';

interface HabitListProps {
  habits: Habit[];
  userHabits: UserHabit[];
  category: HabitCategory;
  onAddOrRemoveHabit: (habit: Habit, isSelected: boolean) => void;
  onAddHabit: () => void;
  onSelectTarget?: (habitId: string, target: number) => void;
}

export function HabitList({
  habits,
  userHabits,
  category,
  onAddOrRemoveHabit,
  onAddHabit,
  onSelectTarget
}: HabitListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, number>>({});
  
  console.log(`[HabitList] Received category prop: ${category}`);
  console.log(`[HabitList] Received ${habits.length} total habits`);

  // Memoize the set of selected habit IDs for efficient lookup
  const selectedHabitIds = useMemo(() => {
    return new Set(userHabits.map(uh => uh.habit_id));
  }, [userHabits]);

  // Filter all available habits by the active category
  const filteredHabits = habits.filter(
    (habit) => habit.category === category
  );
  console.log(`[HabitList] Filtered down to ${filteredHabits.length} habits for category: ${category}`);

  const handleTargetSelect = (habitId: string, target: number) => {
    setSelectedTargets(prev => ({
      ...prev,
      [habitId]: target
    }));
    
    if (onSelectTarget) {
      onSelectTarget(habitId, target);
    }
  };

  return (
    <div className="space-y-4 pt-4 sm:pt-8">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs sm:text-sm text-gray-600 max-w-[75%]">
          Select your habits below, or add your own with the plus
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Add new habit"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Responsive grid layout that adapts to different screen sizes */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {filteredHabits.length === 0 ? (
          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm col-span-full">
            <p className="text-gray-600 mb-4">No habits in this category yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Add your first habit
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isSelected = selectedHabitIds.has(habit.id);
            return (
              <HabitItem
                key={habit.id}
                habit={habit}
                isSelected={isSelected}
                onSelect={onAddOrRemoveHabit}
                userHabits={userHabits}
                onSelectTarget={handleTargetSelect}
                selectedTarget={selectedTargets[habit.id]}
              />
            );
          })
        )}
      </div>

      <CreateHabitModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onHabitCreated={onAddHabit}
        category={category}
      />
    </div>
  );
}
