import { useState } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import type { HabitFrequency, HabitFrequencyDetails } from '../../types/database';

interface HabitFrequencyEditorProps {
  frequency: HabitFrequency;
  details: HabitFrequencyDetails;
  onChange: (frequency: HabitFrequency, details: HabitFrequencyDetails) => void;
}

export function HabitFrequencyEditor({
  frequency,
  details,
  onChange
}: HabitFrequencyEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const validateTime = (time: string): boolean => {
    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const handleFrequencyChange = (newFrequency: HabitFrequency) => {
    // Initialize default details for the new frequency type
    let newDetails: HabitFrequencyDetails = {};

    switch (newFrequency) {
      case 'daily':
        newDetails = {
          daily: {
            tracking: {
              type: 'boolean'
            }
          }
        };
        break;

      case 'days_per_week':
        newDetails = {
          days_per_week: {
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            tracking: {
              type: 'boolean'
            }
          }
        };
        break;

      case 'times_per_week':
        newDetails = {
          times_per_week: {
            target: 3,
            minimum_rest_days: 1
          }
        };
        break;

      case 'after_meals':
        newDetails = {
          after_meals: {
            meals: ['breakfast', 'lunch', 'dinner'],
            window: {
              minutes_after: 15,
              duration_minutes: 15
            }
          }
        };
        break;

      case 'times_per_day':
        newDetails = {
          times_per_day: {
            target: 8,
            minimum_interval_minutes: 60
          }
        };
        break;

      case 'specific_times':
        newDetails = {
          specific_times: {
            times: ['09:00', '15:00', '21:00'],
            flexible_window_minutes: 30
          }
        };
        break;
    }

    onChange(newFrequency, newDetails);
  };

  const renderFrequencyDetails = () => {
    switch (frequency) {
      case 'daily':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Daily Settings</h4>
            <div className="flex items-center gap-2">
              <select
                value={details.daily?.tracking?.type || 'boolean'}
                onChange={e => onChange(frequency, {
                  daily: {
                    tracking: {
                      type: e.target.value as 'boolean' | 'quantity' | 'duration'
                    }
                  }
                })}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="boolean">Yes/No</option>
                <option value="quantity">Quantity</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        );

      case 'specific_times':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Specific Times</h4>
            <div className="space-y-2">
              {details.specific_times?.times.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Input
                    type="time"
                    value={time}
                    onChange={e => {
                      const newTime = e.target.value;
                      if (!validateTime(newTime)) {
                        setError('Invalid time format');
                        return;
                      }
                      setError(null);
                      const newTimes = [...details.specific_times!.times];
                      newTimes[index] = newTime;
                      onChange(frequency, {
                        specific_times: {
                          ...details.specific_times!,
                          times: newTimes
                        }
                      });
                    }}
                    className="w-32"
                  />
                  <button
                    onClick={() => {
                      const newTimes = details.specific_times!.times.filter((_, i) => i !== index);
                      onChange(frequency, {
                        specific_times: {
                          ...details.specific_times!,
                          times: newTimes
                        }
                      });
                    }}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newTimes = [...details.specific_times!.times, '09:00'];
                  onChange(frequency, {
                    specific_times: {
                      ...details.specific_times!,
                      times: newTimes
                    }
                  });
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Add Time
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flexible Window (minutes)
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                value={details.specific_times?.flexible_window_minutes || 0}
                onChange={e => onChange(frequency, {
                  specific_times: {
                    ...details.specific_times!,
                    flexible_window_minutes: parseInt(e.target.value)
                  }
                })}
                className="w-24"
              />
            </div>
          </div>
        );

      // Add other frequency type editors as needed...
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frequency Type
        </label>
        <select
          value={frequency}
          onChange={e => handleFrequencyChange(e.target.value as HabitFrequency)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="daily">Daily</option>
          <option value="days_per_week">Days per Week</option>
          <option value="times_per_week">Times per Week</option>
          <option value="after_meals">After Meals</option>
          <option value="times_per_day">Times per Day</option>
          <option value="specific_times">Specific Times</option>
        </select>
      </div>

      {renderFrequencyDetails()}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}