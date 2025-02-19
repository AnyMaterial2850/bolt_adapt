import { Plus } from 'lucide-react';
import { HabitItem } from './HabitItem';
import { CreateHabitModal } from './CreateHabitModal';
import { UserHabit, HabitCategory } from '../../types/database';
import { useState } from 'react';

interface HabitListProps {
  habits: UserHabit[];
  category: HabitCategory;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: () => void;
}

export function HabitList({ habits, category, onToggleHabit, onAddHabit }: HabitListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const filteredHabits = habits.filter(
    (habit) => habit.habit?.category === category
  );

  return (
    <div className="space-y-4 pt-8">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600 max-w-[75%]">
          Select your habits below, or add your own with the plus
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Add new habit"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">No habits in this category yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Add your first habit
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onToggle={onToggleHabit}
            />
          ))
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