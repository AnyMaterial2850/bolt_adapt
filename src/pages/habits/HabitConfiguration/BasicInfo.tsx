import { Icon } from '@iconify/react';
import { HabitIcon } from '../../../components/habits/HabitIcon';
import type { UserHabit } from '../../../types/database';

interface BasicInfoProps {
  habit: UserHabit;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export function BasicInfo({ habit, isActive, onToggleActive, setHasUnsavedChanges }: BasicInfoProps) {
  const handleToggleActive = (newActiveState: boolean) => {
    onToggleActive(newActiveState);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            {habit.habit?.icon ? (
              <Icon icon={habit.habit.icon} className="w-8 h-8 text-primary-500" />
            ) : (
              <HabitIcon 
                icon={null} 
                category={habit.habit?.category || 'move'} 
                className="w-8 h-8 text-primary-500" 
              />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{habit.habit?.title}</h2>
            {habit.habit?.description && (
              <p className="text-sm text-gray-600">{habit.habit.description}</p>
            )}
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isActive}
            onChange={e => handleToggleActive(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
        </label>
      </div>
    </div>
  );
}