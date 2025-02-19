import { Bell, BellOff, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { DaySchedule as DayScheduleType } from '../../../types/database';

interface DayScheduleProps {
  schedule: DayScheduleType;
  dayName: string;
  onToggleDay: () => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (index: number) => void;
  onUpdateSchedule: (index: number, field: 'event_time' | 'reminder_time', value: string | null) => void;
}

export function DaySchedule({
  schedule,
  dayName,
  onToggleDay,
  onAddSchedule,
  onRemoveSchedule,
  onUpdateSchedule
}: DayScheduleProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{dayName}</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={schedule.active}
            onChange={onToggleDay}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
        </label>
      </div>

      {schedule.active && (
        <div className="space-y-4">
          {schedule.schedules.map((timeSlot, index) => (
            <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Time {index + 1}
                </h4>
                {schedule.schedules.length > 1 && (
                  <button
                    onClick={() => onRemoveSchedule(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Time
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={timeSlot.event_time}
                      onChange={e => onUpdateSchedule(index, 'event_time', e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-600">
                      Reminder
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={timeSlot.reminder_time !== null}
                        onChange={e => onUpdateSchedule(
                          index,
                          'reminder_time',
                          e.target.checked ? timeSlot.event_time : null
                        )}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                    </label>
                  </div>
                  
                  {timeSlot.reminder_time !== null && (
                    <div className="flex items-center gap-2">
                      {timeSlot.reminder_time ? <Bell className="w-5 h-5 text-gray-400" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                      <input
                        type="time"
                        value={timeSlot.reminder_time || ''}
                        onChange={e => onUpdateSchedule(index, 'reminder_time', e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            onClick={onAddSchedule}
            variant="secondary"
            className="w-full"
          >
            Add Another Time
          </Button>
        </div>
      )}
    </div>
  );
}