import { useState, useEffect } from 'react';
import type { Habit } from '../../types/database';

interface HabitTargetSelectorProps {
  habit: Habit;
  selectedTarget?: number;
  onSelectTarget: (target: number) => void;
  selectedTargets: Record<string, number>;
}

export function HabitTargetSelector({ 
  habit, 
  selectedTarget, 
  onSelectTarget,
  selectedTargets
}: HabitTargetSelectorProps) {
  const [selected, setSelected] = useState<number | undefined>(selectedTarget);

  useEffect(() => {
    if (selectedTarget !== undefined) {
      if (selected !== selectedTarget) {
        setSelected(selectedTarget);
      }
    } else if (habit.target && habit.target.length > 0) {
      const currentStoreValue = selectedTargets[habit.id];
      if (currentStoreValue === undefined && selected === undefined) {
        setSelected(habit.target[0]);
        onSelectTarget(habit.target[0]);
      }
    }
  }, [selectedTarget, habit.target, onSelectTarget, habit.id, selectedTargets, selected]);

  // If there are no targets, don't render anything
  if (!habit.target || habit.target.length === 0) {
    return null;
  }

  const handleSelectTarget = (target: number) => {
    setSelected(target);
    onSelectTarget(target);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="font-medium text-gray-900 text-sm sm:text-base">
        Target {habit.unit ? `(${habit.unit})` : ''}
      </h3>
      <div className="space-y-2">
        {habit.target.map((target, index) => (
          <label 
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="radio"
              name={`target-${habit.id}`}
              value={target}
              checked={selected === target}
              onChange={() => handleSelectTarget(target)}
              className="w-4 h-4 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {target} {habit.unit}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
