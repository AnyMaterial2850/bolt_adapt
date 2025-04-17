import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Plus, X, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserHabit } from '../../types/database';
import { format, parse } from 'date-fns';
import { HabitIcon } from '../habits/HabitIcon';
import { HabitAssociatedContent } from '../habits/HabitAssociatedContent';
import confetti from 'canvas-confetti';

interface PlanHabitItemProps {
  habit: UserHabit;
  eventTime: string;
  reminderTime: string | null;
  isCompleted: boolean;
  onToggle: () => Promise<boolean>;
  onReminderToggle?: (newReminderTime: string | null) => Promise<void>;
  disabled?: boolean;
  displayTitle?: string;
  label?: string | null;
}

export function PlanHabitItem({ 
  habit, 
  eventTime, 
  reminderTime,
  isCompleted, 
  onToggle,
  onReminderToggle,
  disabled,
  displayTitle,
  label,
}: PlanHabitItemProps) {
  // State for showing/hiding associated content
  const [showContent, setShowContent] = useState(false);
  
  // Check if habit has associated content
  const hasAssociatedContent = 
    (habit.habit?.bottom_line_items && habit.habit.bottom_line_items.length > 0) ||
    (habit.habit?.go_deeper_urls && habit.habit.go_deeper_urls.length > 0);
  // Enhanced logging to debug reminder data
  console.log(`Habit ${habit.id} (${habit.habit?.title}) - Time: ${eventTime}, Reminder:`, reminderTime);
  console.log(`Reminder data type: ${typeof reminderTime}, Value: "${reminderTime}", Truthiness: ${Boolean(reminderTime)}`);
  const [localIsCompleted, setLocalIsCompleted] = useState(isCompleted);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [editedTime, setEditedTime] = useState(reminderTime || '');
  const [isSaving, setIsSaving] = useState(false);
  const [localReminderTime, setLocalReminderTime] = useState(reminderTime);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalIsCompleted(isCompleted);
    setLocalReminderTime(reminderTime);
  }, [isCompleted, reminderTime]);

  // Focus time input when it becomes visible
  useEffect(() => {
    if (showTimeInput && timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, [showTimeInput]);

  // Convert 24h time to 12h format
  const formattedEventTime = eventTime.includes('-')
    ? `Event ${parseInt(eventTime.split('-')[1]) + 1}`
    : format(
        parse(eventTime, 'HH:mm', new Date()),
        'h:mm a'
      );

  // Format reminder time if exists and ensure it's visible
  const formattedReminderTime = localReminderTime ? (() => {
    try {
      // Log the reminder data for debugging purposes
      console.log(`Reminder for habit ${habit.id}:`, localReminderTime, typeof localReminderTime);
      console.log(`Reminder data stringified: "${JSON.stringify(localReminderTime)}"`);
      
      // Handle case where localReminderTime might be undefined or null but evaluated as truthy
      if (!localReminderTime || localReminderTime === 'null' || localReminderTime === 'undefined') {
        console.warn('Reminder time is falsy despite condition check');
        return null;
      }
      
      // Try to parse the reminder time
      const parsedTime = parse(localReminderTime, 'HH:mm', new Date());
      // Format it nicely for display
      return format(parsedTime, 'h:mm a');
    } catch (error) {
      // If there's an error parsing, log it and return the raw value
      console.error(`Error parsing reminder time:`, reminderTime, error);
      return reminderTime;
    }
  })() : null;

  const [showSparks, setShowSparks] = useState(false);

  const handleToggle = async () => {
    if (disabled) return;

    // Immediately toggle the local state
    const newCompletedState = !localIsCompleted;
    setLocalIsCompleted(newCompletedState);

    // Show sparks animation if being marked as completed
    if (newCompletedState) {
      // Trigger the sparks animation
      setShowSparks(true);

      // Create a small confetti effect around the button
      const buttonElement = document.activeElement as HTMLElement;
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 20,
          spread: 60,
          origin: { x, y },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
          shapes: ['circle'],
          scalar: 1, // Larger particles
          gravity: 0.6,  // Less gravity so they fly higher
          ticks: 150,   // Longer animation
          zIndex: 1000,
          disableForReducedMotion: true
        });
      }

      // Reset the animation after it completes
      setTimeout(() => {
        setShowSparks(false);
      }, 1200);
    }

    try {
      const success = await onToggle();
      
      if (!success) {
        // Revert if server update fails
        setLocalIsCompleted(isCompleted);
      }
    } catch (error) {
      // Revert if an error occurs
      setLocalIsCompleted(isCompleted);
    }
  };

  // Reminder management handlers
  const handleReminderClick = () => {
    if (!onReminderToggle) return;
    setShowReminderOptions(true);
  };

  const handleAddReminder = () => {
    // Set default time to 5 minutes before event time
    try {
      const eventDate = parse(eventTime, 'HH:mm', new Date());
      eventDate.setMinutes(eventDate.getMinutes() - 5);
      const defaultTime = format(eventDate, 'HH:mm');
      setEditedTime(defaultTime);
    } catch (e) {
      // If eventTime parsing fails, just set a reasonable default
      setEditedTime('08:00');
    }
    
    setShowTimeInput(true);
  };

  const handleRemoveReminder = async () => {
    if (!onReminderToggle) return;
    try {
      setIsSaving(true);
      // Immediately update local state for responsive UI
      setLocalReminderTime(null);
      
      await onReminderToggle(null);
      setShowReminderOptions(false);
      
      // Show feedback message
      console.log("✅ Reminder removed successfully");
    } catch (error) {
      console.error('Failed to remove reminder:', error);
      // Revert local state if there was an error
      setLocalReminderTime(reminderTime);
      alert("Failed to remove reminder. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!onReminderToggle || !editedTime) return;
    
    try {
      // Validate time format (HH:mm)
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(editedTime)) {
        throw new Error('Invalid time format. Please use HH:MM format (24-hour).');
      }
      
      setIsSaving(true);
      // Optimistically update local state
      setLocalReminderTime(editedTime);
      
      await onReminderToggle(editedTime);
      setShowTimeInput(false);
      setShowReminderOptions(false);
      
      // Show feedback message
      console.log(`✅ Reminder ${reminderTime ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Failed to save reminder:', error);
      // Revert local state
      setLocalReminderTime(reminderTime);
      alert(error instanceof Error ? error.message : 'Failed to save reminder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setShowTimeInput(false);
    setShowReminderOptions(false);
    // Reset edited time to current reminder time
    setEditedTime(reminderTime || '');
  };

  return (
    <div className="bg-white rounded-xl p-4">
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
        {/* Left Section: Icon (Slightly Smaller) */}
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <HabitIcon 
            icon={habit.habit?.icon || ''}
            category={habit.habit?.category || 'move'}
            className="w-12 h-12"
            colorByCategory={true}
          />
        </div>

        {/* Middle Section: Label and Time */}
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 text-base break-words mb-1">
            {label ? `${label} - ${habit.habit?.title}` : (displayTitle || habit.habit?.title)}
          </h3>
          <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{formattedEventTime}</span>
            
            {/* Debug log for reminder conditions */}
            {(() => {
              console.log('Reminder display condition:', {
                reminderTime: Boolean(reminderTime),
                localReminderTime: Boolean(localReminderTime),
                formattedReminderTime: Boolean(formattedReminderTime),
                isSaving: isSaving,
                label: label
              });
              return null;
            })()}
            
            {/* Loading indicator when saving */}
            {isSaving && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 ml-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 opacity-75 animate-pulse"></div>
                <span className="font-medium text-blue-700 text-xs">Saving...</span>
              </div>
            )}
            
            {/* Show reminder time if exists */}
            {localReminderTime && formattedReminderTime && !showReminderOptions && !showTimeInput && !isSaving && (
              <button 
                onClick={handleReminderClick}
                className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 ml-1 hover:bg-blue-200 transition-colors"
                disabled={disabled || !onReminderToggle}
              >
                <Bell className="w-3 h-3 text-primary-600" />
                <span className="font-medium text-primary-700">{formattedReminderTime}</span>
              </button>
            )}
            
            {/* Show "Add Reminder" button if no reminder exists */}
            {!localReminderTime && !showReminderOptions && !showTimeInput && !isSaving && onReminderToggle && (
              <button 
                onClick={handleAddReminder}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 ml-1 hover:bg-gray-200 transition-colors text-gray-600"
                disabled={disabled}
              >
                <Plus className="w-3 h-3" />
                <span className="font-medium">Add Reminder</span>
              </button>
            )}
            
            {/* Reminder Options (Edit/Delete) */}
            {showReminderOptions && !showTimeInput && (
              <div className="flex items-center gap-2 ml-1">
                <button 
                  onClick={handleAddReminder}
                  className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors"
                >
                  <span className="font-medium text-primary-700">Edit</span>
                </button>
                <button 
                  onClick={handleRemoveReminder}
                  className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-lg border border-red-200 hover:bg-red-200 transition-colors"
                >
                  <span className="font-medium text-red-700">Remove</span>
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="ml-1 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
            
            {/* Time Input */}
            {showTimeInput && (
              <div className="flex items-center gap-2 ml-1">
                <input
                  ref={timeInputRef}
                  type="time"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-blue-200 text-xs w-24"
                />
                <button 
                  onClick={handleSaveReminder}
                  className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors"
                >
                  <span className="font-medium text-primary-700">Save</span>
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="ml-1 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Buttons */}
        <div className="flex items-center justify-center gap-2">
          {/* Info button - only show if habit has associated content */}
          {hasAssociatedContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContent(!showContent);
              }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                'bg-green-100 text-green-600 hover:bg-green-200'
              )}
              aria-label="Learn more about this habit"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          
          {/* Completion Button */}
          <button
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors relative',
              localIsCompleted
                ? 'bg-success-500 text-white hover:bg-success-600'
                : disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {/* Sparks animation with larger, more visible sparks and orbiting effect */}
            {showSparks && (
              <div className="absolute inset-[-16px] rounded-full overflow-visible z-10 pointer-events-none">
                {/* Top sparks */}
                <div className="absolute top-0 left-1/4 w-[3px] h-[6px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-1"></div>
                <div className="absolute top-0 right-1/4 w-[3px] h-[6px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-2"></div>
                {/* Right sparks */}
                <div className="absolute right-0 top-1/4 w-[6px] h-[3px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-3"></div>
                <div className="absolute right-0 bottom-1/4 w-[6px] h-[3px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-4"></div>
                {/* Bottom sparks */}
                <div className="absolute bottom-0 right-1/4 w-[3px] h-[6px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-5"></div>
                <div className="absolute bottom-0 left-1/4 w-[3px] h-[6px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-6"></div>
                {/* Left sparks */}
                <div className="absolute left-0 bottom-1/4 w-[6px] h-[3px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-7"></div>
                <div className="absolute left-0 top-1/4 w-[6px] h-[3px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-8"></div>
                {/* Corner sparks */}
                <div className="absolute top-[4px] left-[4px] w-[4px] h-[4px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-9"></div>
                <div className="absolute top-[4px] right-[4px] w-[4px] h-[4px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-10"></div>
                <div className="absolute bottom-[4px] right-[4px] w-[4px] h-[4px] bg-yellow-300 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-11"></div>
                <div className="absolute bottom-[4px] left-[4px] w-[4px] h-[4px] bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.9)] animate-spark-12"></div>
              </div>
            )}
            
            <Check className={cn(
              "w-4 h-4",
              !localIsCompleted && "opacity-70"
            )} />
          </button>
        </div>
      </div>
      
      {/* Expandable associated content */}
      {showContent && hasAssociatedContent && (
        <div className="mt-3 px-3">
          <HabitAssociatedContent
            bottomLineItems={habit.habit?.bottom_line_items || []}
            goDeeperTitles={habit.habit?.go_deeper_titles || []}
            goDeeperUrls={habit.habit?.go_deeper_urls || []}
          />
        </div>
      )}
    </div>
  );
}
