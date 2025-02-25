import { useState } from 'react';
import { Bell, BellOff, Clock, AlertCircle, ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserHabit } from '../../types/database';
import { format, parse } from 'date-fns';
import { HabitIcon } from '../habits/HabitIcon';
import { Toast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { HabitContent } from '../habits/HabitContent';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { requestNotificationPermission } from '../../lib/notification';

interface PlanHabitItemProps {
  habit: UserHabit;
  eventTime: string;
  reminderTime: string | null;
  isCompleted: boolean;
  onToggle: () => void;
  onReminderToggle: (newReminderTime: string | null) => Promise<void>;
  disabled?: boolean;
}

export function PlanHabitItem({ 
  habit, 
  eventTime, 
  reminderTime,
  isCompleted, 
  onToggle,
  onReminderToggle,
  disabled,
}: PlanHabitItemProps) {
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(reminderTime || '');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { addLog } = useDebugStore();

  // Convert 24h time to 12h format
  const formattedEventTime = format(
    parse(eventTime, 'HH:mm', new Date()),
    'h:mm a'
  );

  // Format reminder time if exists
  const formattedReminderTime = reminderTime ? format(
    parse(reminderTime, 'HH:mm', new Date()),
    'h:mm a'
  ) : null;

  const handleReminderToggle = async () => {
    if (isUpdatingReminder) return;

    try {
      setIsUpdatingReminder(true);
      setError(null);

      if (reminderTime) {
        // Turn off reminder by updating daily_schedules
        const updatedSchedules = habit.daily_schedules.map(schedule => ({
          ...schedule,
          schedules: schedule.schedules.map(slot => 
            slot.event_time === eventTime
              ? { ...slot, reminder_time: null }
              : slot
          )
        }));

        const { error: updateError } = await supabase
          .from('user_habits')
          .update({
            daily_schedules: updatedSchedules,
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id);




        if (updateError) throw updateError;

        await onReminderToggle(null);
        setToast({
          message: 'Reminder removed',
          type: 'success'
        });
      } else {
        // Show modal to set reminder time
        setSelectedTime(eventTime);
        setShowReminderModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
      setToast({
        message: 'Failed to update reminder',
        type: 'error'
      });
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const validateReminderTime = (time: string): boolean => {
    // Validate time format (HH:MM)
    if (!time.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
      setReminderError('Invalid time format. Expected HH:MM');
      return false;
    }

    const reminderDate = parse(time, 'HH:mm', new Date());
    const eventDate = parse(eventTime, 'HH:mm', new Date());

    if (!reminderDate || !eventDate) {
      setReminderError('Invalid time format');
      return false;
    }

    if (reminderDate >= eventDate) {
      setReminderError('Reminder time must be before the event time');
      return false;
    }

    setReminderError(null);
    return true;
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    validateReminderTime(time);
  };

  const handleSetReminder = async () => {
    if (!selectedTime) return;

    if (!validateReminderTime(selectedTime)) {
      return;
    }

    try {
      setIsUpdatingReminder(true);
      addLog('Setting reminder...', 'info');


        // request for notification permission
        await requestNotificationPermission();

      // Update daily_schedules with new reminder time
      const updatedSchedules = habit.daily_schedules.map(schedule => ({
        ...schedule,
        schedules: schedule.schedules.map(slot => 
          slot.event_time === eventTime
            ? { ...slot, reminder_time: selectedTime }
            : slot
        )
      }));

      console.log({updatedSchedules})

      const { error: updateError } = await supabase
        .from('user_habits')
        .update({
          daily_schedules: updatedSchedules,
          updated_at: new Date().toISOString()
        })
        .eq('id', habit.id);

      if (updateError) throw updateError;

      await onReminderToggle(selectedTime);
      setShowReminderModal(false);
      setToast({
        message: 'Reminder set successfully',
        type: 'success'
      });
      addLog('Reminder set successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set reminder';
      setError(message);
      addLog(`Failed to set reminder: ${message}`, 'error');
      setToast({
        message:  message,
        type: 'error'
      });
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const hasContent = habit.habit && (
    habit.habit.content_type ||
    (habit.habit.bottom_line_items && habit.habit.bottom_line_items.length > 0) ||
    (habit.habit.go_deeper_titles && habit.habit.go_deeper_titles.length > 0)
  );

  return (
    <>
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
              <HabitIcon 
                icon={habit.habit?.icon || ""} 
                category={habit.habit?.category || 'move'} 
                className="text-primary-500"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-500">{formattedEventTime}</span>
                <span className="text-sm text-gray-300">·</span>
                <h3 className="font-medium text-gray-900">{habit.habit?.title}</h3>
                <span className="text-sm text-gray-300">·</span>
                <button
                  onClick={handleReminderToggle}
                  disabled={isUpdatingReminder}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors rounded-full px-2.5 py-1 -my-1",
                    isUpdatingReminder && "opacity-50 cursor-wait",
                    error ? "bg-red-50 text-red-600 hover:bg-red-100" :
                    reminderTime
                      ? "bg-success-50 text-success-600 hover:text-success-700 hover:bg-success-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    "group"
                  )}
                  title={error || undefined}
                >
                  {isUpdatingReminder ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : reminderTime ? (
                    <>
                      <Bell className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-medium">{formattedReminderTime}</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-medium">Add reminder</span>
                    </>
                  )}
                </button>
              </div>
              {habit.habit?.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {habit.habit.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
              'w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors',
              isCompleted
                ? 'bg-success-500 text-white hover:bg-success-600'
                : disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>

        {hasContent && (
          <div className="border-t mt-4 pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900"
            >
              <span className="font-medium">Learn More</span>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 transition-transform duration-300 ease-in-out",
                  isExpanded ? "rotate-180" : ""
                )}
              />
            </button>

            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className={cn(
                  "mt-4 transition-all duration-300 ease-in-out",
                  isExpanded ? "translate-y-0" : "-translate-y-2"
                )}>
                  {habit.habit && <HabitContent habit={habit.habit} />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderError(null);
        }}
        title="Set Reminder Time"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When would you like to be reminded?
            </label>
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="time"
                value={selectedTime}
                onChange={e => handleTimeChange(e.target.value)}
                className={cn(
                  "px-3 py-2 bg-white border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  reminderError ? "border-red-300" : "border-gray-300"
                )}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield',
                }}
              />
            </div>
            {reminderError ? (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{reminderError}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Event time is {formattedEventTime}. Reminder must be set before this time.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowReminderModal(false);
                setReminderError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSetReminder}
              disabled={!selectedTime || !!reminderError}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg transition-colors",
                !selectedTime || !!reminderError
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary-600"
              )}
            >
              Set Reminder
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}