import { useState } from 'react';
import { Plus, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { UserHabit } from '../../../types/database';
import { DaySchedule } from './DaySchedule';
import { validateReminderTime } from './utils';

interface ScheduleSectionProps {
  habit: UserHabit;
  setHabit: (habit: UserHabit) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'M', full: 'Monday' },
  { id: 'Tue', label: 'T', full: 'Tuesday' },
  { id: 'Wed', label: 'W', full: 'Wednesday' },
  { id: 'Thu', label: 'T', full: 'Thursday' },
  { id: 'Fri', label: 'F', full: 'Friday' },
  { id: 'Sat', label: 'S', full: 'Saturday' },
  { id: 'Sun', label: 'S', full: 'Sunday' },
];

export function ScheduleSection({ habit, setHabit, setHasUnsavedChanges, setToast }: ScheduleSectionProps) {
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [animatingDays, setAnimatingDays] = useState<string[]>([]);

  const toggleDay = (dayId: string) => {
    const updatedSchedules = habit.daily_schedules.map(schedule => 
      schedule.day === dayId
        ? { ...schedule, active: !schedule.active }
        : schedule
    );

    setHabit({ ...habit, daily_schedules: updatedSchedules });
    setHasUnsavedChanges(true);
  };

  const addSchedule = (dayId: string) => {
    const updatedSchedules = habit.daily_schedules.map(schedule => 
      schedule.day === dayId
        ? {
            ...schedule,
            schedules: [
              ...schedule.schedules,
              { event_time: '09:00', reminder_time: null }
            ]
          }
        : schedule
    );

    setHabit({ ...habit, daily_schedules: updatedSchedules });
    setHasUnsavedChanges(true);
  };

  const removeSchedule = (dayId: string, index: number) => {
    const updatedSchedules = habit.daily_schedules.map(schedule => 
      schedule.day === dayId
        ? {
            ...schedule,
            schedules: schedule.schedules.filter((_, i) => i !== index)
          }
        : schedule
    );

    setHabit({ ...habit, daily_schedules: updatedSchedules });
    setHasUnsavedChanges(true);
  };

  const updateSchedule = (dayId: string, index: number, field: 'event_time' | 'reminder_time', value: string | null) => {
    if (field === 'reminder_time' && value) {
      // Get the event time for this schedule
      const schedule = habit.daily_schedules.find(s => s.day === dayId)?.schedules[index];
      if (!schedule) return;

      // Validate reminder time
      const error = validateReminderTime(schedule.event_time, value);
      if (error) {
        setToast({
          message: error,
          type: 'error'
        });
        return;
      }
    }

    const updatedSchedules = habit.daily_schedules.map(schedule => 
      schedule.day === dayId
        ? {
            ...schedule,
            schedules: schedule.schedules.map((slot, i) => 
              i === index
                ? { ...slot, [field]: value }
                : slot
            )
          }
        : schedule
    );

    setHabit({ ...habit, daily_schedules: updatedSchedules });
    setHasUnsavedChanges(true);
  };

  const copyToAllDays = () => {
    const selectedSchedule = habit.daily_schedules.find(s => s.day === selectedDay);
    if (!selectedSchedule) return;

    const daysToAnimate = DAYS_OF_WEEK
      .map(d => d.id)
      .filter(day => day !== selectedDay);

    setAnimatingDays(daysToAnimate);

    const updatedSchedules = habit.daily_schedules.map(schedule => ({
      ...schedule,
      active: selectedSchedule.active,
      schedules: [...selectedSchedule.schedules]
    }));

    setHabit({ ...habit, daily_schedules: updatedSchedules });
    setHasUnsavedChanges(true);

    setToast({
      message: `Copied ${DAYS_OF_WEEK.find(d => d.id === selectedDay)?.full}'s schedule to all days`,
      type: 'success'
    });

    setTimeout(() => {
      setAnimatingDays([]);
    }, 600);
  };

  const selectedSchedule = habit.daily_schedules.find(s => s.day === selectedDay);
  const selectedDayName = DAYS_OF_WEEK.find(d => d.id === selectedDay)?.full;

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Habit Schedule</h2>
        <button
          onClick={copyToAllDays}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Copy className="w-4 h-4 mr-1" />
          Copy to All Days
        </button>
      </div>

      <div className="flex justify-between">
        {DAYS_OF_WEEK.map(day => {
          const schedule = habit.daily_schedules.find(s => s.day === day.id);
          const isSelected = selectedDay === day.id;
          const isAnimating = animatingDays.includes(day.id);
          
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`
                relative w-10 h-10 rounded-full flex items-center justify-center font-medium
                transition-all duration-300
                ${schedule?.active
                  ? isSelected
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#4CAF50]/20 text-[#4CAF50]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${isAnimating ? 'ring-2 ring-[#4CAF50] ring-offset-2 scale-110' : ''}
              `}
            >
              {day.label}
              {isSelected && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#4CAF50]" />
              )}
            </button>
          );
        })}
      </div>

      {selectedSchedule && selectedDayName && (
        <DaySchedule
          schedule={selectedSchedule}
          dayName={selectedDayName}
          onToggleDay={() => toggleDay(selectedDay)}
          onAddSchedule={() => addSchedule(selectedDay)}
          onRemoveSchedule={(index) => removeSchedule(selectedDay, index)}
          onUpdateSchedule={(index, field, value) => updateSchedule(selectedDay, index, field, value)}
        />
      )}
    </div>
  );
}