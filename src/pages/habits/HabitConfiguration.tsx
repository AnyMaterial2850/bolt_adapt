import { useState, useEffect , useCallback} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Copy, Search} from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import type { UserHabit, HabitCategory } from '../../types/database';
import { useDebugStore } from '../../stores/debugStore';
import { HabitIcon } from '../../components/habits/HabitIcon';
import { HabitTargetSelector } from '../../components/habits/HabitTargetSelector';
import { parse } from 'date-fns';
import useAppStore from '../../stores/appStore';
import { useHabitStore } from '../../stores/habitStore';

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'M', full: 'Monday' },
  { id: 'Tue', label: 'T', full: 'Tuesday' },
  { id: 'Wed', label: 'W', full: 'Wednesday' },
  { id: 'Thu', label: 'T', full: 'Thursday' },
  { id: 'Fri', label: 'F', full: 'Friday' },
  { id: 'Sat', label: 'S', full: 'Saturday' },
  { id: 'Sun', label: 'S', full: 'Sunday' },
];

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'eat', label: 'EAT' },
  { value: 'move', label: 'MOVE' },
  { value: 'mind', label: 'MIND' },
  { value: 'sleep', label: 'SLEEP' },
];

interface DaySchedule {
  day: string;
  active: boolean;
  schedules: {
    event_time: string;
    reminder_time: string | null;
    label: string | null;
  }[];
}

export function HabitConfiguration() {
  const navigate = useNavigate();
  const { habitId } = useParams();
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const { loadUserHabits, forceReloadUserHabits } = useHabitStore();
  const [loading, setLoading] = useState(true);
  const [habit, setHabit] = useState<UserHabit | null>(null);
  const [dailySchedules, setDailySchedules] = useState<DaySchedule[]>([]);
  const [isActive, setIsActive] = useState(false);
  // Initialize selectedDay to the current day of the week
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to our day format (Mon, Tue, etc.)
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayMap[dayIndex];
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const { showConfirmDialog, setShowConfirmDialog, setPendingNavigation
    , hasUnsavedChanges, setHasUnsavedChanges,  nextNavigationPage, setActiveTab,setNextNavigationPage

   } =
    useAppStore();

  const [animatingDays, setAnimatingDays] = useState<string[]>([]);
  const { selectedTargets, setSelectedTarget } = useHabitStore();
  const [selectedHabitTarget, setSelectedHabitTarget] = useState<number | undefined>(undefined);

  // Custom habit editing state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitCategory, setHabitCategory] = useState<HabitCategory>('move');
  const [habitIcon, setHabitIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<string[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);


  const loadHabit = useCallback(async () => {
    setLoading(true);
    console.log(`Loading habit configuration for ID: ${habitId}...`);
    addLog(`Loading habit configuration for ID: ${habitId}...`, 'info');

    try {
      // Validate habitId
      if (!habitId) {
        console.error('No habit ID provided');
        addLog('No habit ID provided', 'error');
        setToast({
          message: 'Invalid habit ID. Please try again.',
          type: 'error'
        });
        return;
      }

      // First, check if the habit exists in user_habits
      const { data: userHabitData, error: userHabitError } = await supabase
        .from('user_habits')
        .select('id')
        .eq('id', habitId)
        .single();

      if (userHabitError) {
        console.error(`User habit query error: ${userHabitError.message}`);
        addLog(`User habit query error: ${userHabitError.message}`, 'error');
        setToast({
          message: 'Could not verify habit details.',
          type: 'error'
        });
        return;
      }

      if (!userHabitData) {
        console.error(`No user habit found with ID: ${habitId}`);
        addLog(`No user habit found with ID: ${habitId}`, 'warn');
        setToast({
          message: 'Habit not found. It may have been deleted.',
          type: 'error'
        });
        return;
      }

      // Now fetch full habit details
      const { data, error } = await supabase
        .from('user_habits')
        .select(`
          *,
          habit:habits(*)
        `)
        .eq('id', habitId)
        .single();

      if (error) {
        console.error(`Error loading habit details: ${error.message}`);
        addLog(`Error loading habit details: ${error.message}`, 'error');
        setToast({
          message: error.message || 'Could not load habit details.',
          type: 'error'
        });
        return;
      }

      if (!data) {
        console.error('No habit details found');
        addLog('No habit details found after verification', 'warn');
        setToast({
          message: 'Could not retrieve habit details.',
          type: 'error'
        });
        return;
      }

      console.log('Habit data loaded successfully:', data);
      addLog(`Loaded habit: ${data.habit?.title || 'Untitled'}`, 'success');
      
      // Safely set states with fallback values
      setHabit(data);
      setIsActive(data.active ?? false);
      setHabitTitle(data.habit?.title || '');
      setHabitDescription(data.habit?.description || '');
      setHabitCategory(data.habit?.category || 'move');
      setHabitIcon(data.habit?.icon || null);
      
      // Set selected target if available
      if (data.habit?.id && selectedTargets[data.habit.id] !== undefined) {
        setSelectedHabitTarget(selectedTargets[data.habit.id]);
      } else if (data.habit?.target && data.habit.target.length > 0) {
        setSelectedHabitTarget(data.habit.target[0]);
      }
      
      // Handle daily schedules
      const schedules = data.daily_schedules || [];
      if (schedules.length === 0) {
        const defaultSchedules = DAYS_OF_WEEK.map(day => ({
          day: day.id,
          active: true,
          schedules: [{
            event_time: '09:00',
            reminder_time: null,
            label: null
          }]
        }));
        setDailySchedules(defaultSchedules);
        addLog('Initialized default schedules', 'info');
      } else {
        setDailySchedules(schedules);
        addLog('Loaded existing schedules', 'info');
      }
    } catch (err) {
      console.error('Unexpected error in loadHabit:', err);
      addLog(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      setToast({
        message: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      // Always ensure loading state is set to false
      setLoading(false);
    }
  }, [habitId, addLog, selectedTargets, setHabit, setIsActive, setHabitTitle, setHabitDescription, setHabitCategory, setHabitIcon, setDailySchedules]);
  useEffect(() => {
    if (!user || !habitId) {
      addLog('No user or habit ID found, redirecting...', 'error');
      navigate(-1);
      return;
    }

    loadHabit();
  }, [user, habitId, navigate, addLog, loadHabit]);

  useEffect(() => {
    if (!habit) return;
    
    const hasScheduleChanges = 
      isActive !== habit.active ||
      JSON.stringify(dailySchedules) !== JSON.stringify(habit.daily_schedules);

    const hasHabitChanges = 
      habitTitle !== habit.habit?.title ||
      habitDescription !== (habit.habit?.description || '') ||
      habitCategory !== habit.habit?.category ||
      habitIcon !== habit.habit?.icon;
    
    setHasUnsavedChanges(hasScheduleChanges || hasHabitChanges);
  }, [habit, isActive, dailySchedules, habitTitle, habitDescription, habitCategory, habitIcon, setHasUnsavedChanges]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
      setPendingNavigation(true);
      setNextNavigationPage(-1);
    } else {
      navigate(-1);
    }
  };


  const handleToggleActive = async (newActiveState: boolean) => {
    if (!habit || isSaving) return;

    // Optimistically update UI
    const previousActiveState = isActive;
    setIsActive(newActiveState);
    setIsSaving(true);

    try {
      addLog(`${newActiveState ? 'Activating' : 'Deactivating'} habit...`, 'info');

      // Comprehensive deduplication and verification
      const { data: duplicateEntries, error: duplicateError } = await supabase
        .from('user_habits')
        .select('id, user_id, habit_id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('habit_id', habit.habit?.id);

      if (duplicateError) {
        addLog(`Duplicate check error: ${duplicateError.message}`, 'error');
        throw new Error('Failed to verify habit entries');
      }

      // Remove duplicate entries, keeping only the first one
      if (duplicateEntries && duplicateEntries.length > 1) {
        const primaryEntry = duplicateEntries[0];
        const duplicateIds = duplicateEntries
          .slice(1)
          .map(entry => entry.id);

        addLog(`Removing ${duplicateIds.length} duplicate habit entries`, 'warn');

        const { error: cleanupError } = await supabase
          .from('user_habits')
          .delete()
          .in('id', duplicateIds);

        if (cleanupError) {
          addLog(`Failed to remove duplicate entries: ${cleanupError.message}`, 'error');
        }

        // Use the primary entry for update
        habit.id = primaryEntry.id;
      }

      // Proceed with update
      const { error } = await supabase
        .from('user_habits')
        .update({
          active: newActiveState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id)
        .eq('user_id', user?.id)
        .eq('habit_id', habit.habit?.id)
        .single(); // Ensure single row update

      if (error) {
        // Revert UI state if update fails
        addLog(`Failed to update habit status: ${error.message}`, 'error');
        setIsActive(previousActiveState);
        setToast({
          message: 'Failed to update habit status. Please try again.',
          type: 'error'
        });
        return;
      }

      // Update habit state
      setHabit(prev => prev ? { ...prev, active: newActiveState } : null);
      
      addLog(`Habit ${newActiveState ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err) {
      console.error('Unexpected error toggling habit:', err);
      setIsActive(previousActiveState);
      setToast({
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!habit || isSaving) return;

    // Check for duplicate schedules
    for (const daySchedule of dailySchedules) {
        const times = daySchedule.schedules.map(schedule => schedule.event_time);
        const hasDuplicates = times.some((time, index) => times.indexOf(time) !== index);
        if (hasDuplicates) {
            setToast({
                message: 'Duplicate event times found. Please ensure all times are unique.',
                type: 'error'
            });
            return;
        }
    }

    try {
      setIsSaving(true);
      addLog('Saving habit changes...', 'info');

      // Validate schedules
      for (const daySchedule of dailySchedules) {
        if (daySchedule.active && (!daySchedule.schedules || daySchedule.schedules.length === 0)) {
          const error = 'Schedules cannot be empty for active days.';
          addLog(error, 'error');
          throw new Error(error);
        }
      }

      // Update habit details if changed
      if (
        habitTitle !== habit.habit?.title ||
        habitDescription !== habit.habit?.description ||
        habitCategory !== habit.habit?.category ||
        habitIcon !== habit.habit?.icon
      ) {
        addLog('Updating habit details...', 'info');
        const { error: habitError } = await supabase
          .from('habits')
          .update({
            title: habitTitle.trim(),
            description: habitDescription.trim() || null,
            category: habitCategory,
            icon: habitIcon,
            updated_at: new Date().toISOString(),
          })
          .eq('id', habit.habit?.id);

        if (habitError) {
          addLog(`Failed to update habit details: ${habitError.message}`, 'error');
          throw habitError;
        }
        addLog('Habit details updated successfully', 'success');
      }

      // Update schedules
      addLog('Updating schedules...', 'info');
      const { error: scheduleError } = await supabase
        .from('user_habits')
        .update({
          active: isActive,
          daily_schedules: dailySchedules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id);

      if (scheduleError) {
        addLog(`Failed to update schedules: ${scheduleError.message}`, 'error');
        throw scheduleError;
      }

      addLog('Changes saved successfully', 'success');

      // Update local state
      setHabit(prev => prev ?
        {
        ...prev,
        active: isActive,
        daily_schedules: dailySchedules,
        habit: prev.habit ? {
          ...prev.habit,
          title: habitTitle,
          description: habitDescription || null,
          category: habitCategory,
          icon: habitIcon,
        }
        : undefined
      } : null);

      // Force reload user habits to update the UI immediately
      if (user?.id) {
        try {
          await forceReloadUserHabits(user.id);
          addLog('Force reloaded user habits', 'success');
        } catch (error) {
          console.error('Failed to force reload user habits:', error);
        }
      }

      setHasUnsavedChanges(false);

    setShowConfirmDialog(false);
    setPendingNavigation(false);
    
    // Handle different types of navigation after saving
    if (nextNavigationPage === -1) {
      navigate(-1);
      return;
    } else if (typeof nextNavigationPage === 'string' && ['goal', 'plan', 'habits'].includes(nextNavigationPage)) {
      // This is a tab navigation
      navigate('/');
      setActiveTab(nextNavigationPage);
    } else if (typeof nextNavigationPage === 'string' && ['eat', 'move', 'mind', 'sleep'].includes(nextNavigationPage)) {
      // This is a category navigation
      navigate('/');
      // Wait for navigation to complete before changing category
      setTimeout(() => {
        console.log('Changing category to:', nextNavigationPage);
        const setActiveCategory = (category: string) => {
          // Dispatch a custom event to change the category
          // This is a workaround since we don't have direct access to the setActiveCategory function
          window.dispatchEvent(new CustomEvent('change-habit-category', { 
            detail: { category: nextNavigationPage } 
          }));
        };
        setActiveCategory(nextNavigationPage);
      }, 100);
    } else {
      // Default fallback
      navigate('/');
    }
    } catch (err) {
      console.error('Error saving habit:', err);
      addLog(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      setToast({
        message: 'Failed to save changes. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const searchIcons = async (query: string) => {
    if (!query) {
      setIconResults([]);
      return;
    }

    setLoadingIcons(true);
    try {
      addLog('Searching icons...', 'info');
      // Restrict search to only Material Design Icons (MDI) set for consistency
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefix=mdi&limit=30`);
      if (!response.ok) throw new Error('Failed to fetch icons');
      
      const data = await response.json();
      setIconResults(data.icons || []);
      addLog(`Found ${data.icons?.length || 0} icons`, 'success');
    } catch (err) {
      console.error('Error searching icons:', err);
      const message = err instanceof Error ? err.message : 'Failed to search icons';
      addLog(message, 'error');
      setIconResults([]);
    } finally {
      setLoadingIcons(false);
    }
  };

  const handleIconSearch = (value: string) => {
    setIconSearch(value);
    searchIcons(value);
  };

  const selectIcon = (icon: string) => {
    addLog(`Selected icon: ${icon}`, 'info');
    setHabitIcon(icon);
    setShowIconPicker(false);
    setIconSearch('');
    setIconResults([]);
  };
const toggleDay = async (dayId: string) => {
  // Update local state
  setDailySchedules(prev =>
    prev.map(schedule =>
      schedule.day === dayId
        ? { ...schedule, active: !schedule.active }
        : schedule
    )
  );
  
  // Set unsaved changes flag
  setHasUnsavedChanges(true);
};



  const addSchedule = (dayId: string) => {
    setDailySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId
          ? {
              ...schedule,
              schedules: [
                ...schedule.schedules,
                { event_time: '09:00', reminder_time: null, label: null }
              ]
            }
          : schedule
      )
    );
  };

  const removeSchedule = (dayId: string, index: number) => {
    setDailySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId
          ? {
              ...schedule,
              schedules: schedule.schedules.filter((_, i) => i !== index)
            }
          : schedule
      )
    );
  };

  const validateReminderTime = (eventTime: string, reminderTime: string | null): string | null => {
    if (!reminderTime) return null;

    // Validate time format (HH:MM)
    if (!reminderTime.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
      return 'Invalid time format. Expected HH:MM';
    }

    const reminderDate = parse(reminderTime, 'HH:mm', new Date());
    const eventDate = parse(eventTime, 'HH:mm', new Date());

    if (!reminderDate || !eventDate) {
      return 'Invalid time format';
    }

    if (reminderDate >= eventDate) {
      return 'Reminder time must be before the event time';
    }

    return null;
  };

  const updateSchedule = (
    dayId: string,
    index: number,
    field: keyof DaySchedule['schedules'][0],
    value: string | null
  ) => {
    // Debug log for reminder updates
    if (field === 'reminder_time') {
      console.log(`Updating reminder: dayId=${dayId}, index=${index}, value=`, value);
    }
    
    if (field === 'reminder_time' && value) {
      // Get the event time for this schedule
      const schedule = dailySchedules.find(s => s.day === dayId)?.schedules[index];
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

    if (field === 'event_time') {
        const isDuplicate = dailySchedules
            .find(s => s.day === dayId)?.schedules
            .find(s => s.event_time === value);
        if (isDuplicate) {
           setToast(
                {
                    message: 'This time is already scheduled. Please choose a different time.',
                    type: 'error'
                }
            ,
           )
            return;
        }
    }

    const updatedSchedules = (prev: DaySchedule[]) => 
      prev.map((schedule: DaySchedule) => 
        schedule.day === dayId
          ? {
              ...schedule,
              schedules: schedule.schedules.map((timeSlot, i: number) => 
                i === index
                  ? { ...timeSlot, [field]: value }
                  : timeSlot
              )
            }
          : schedule
      );
    
    setDailySchedules(updatedSchedules);
    
    // Debug log the updated schedules for the affected day
    if (field === 'reminder_time') {
      const updatedDay = updatedSchedules(dailySchedules).find((s: DaySchedule) => s.day === dayId);
      console.log(`Updated schedules for ${dayId}:`, updatedDay?.schedules);
    }
  };

  const copyToAllDays = () => {
    const selectedSchedule = dailySchedules.find(s => s.day === selectedDay);
    if (!selectedSchedule) return;

    const daysToAnimate = DAYS_OF_WEEK
      .map(d => d.id)
      .filter(day => day !== selectedDay);

    setAnimatingDays(daysToAnimate);

    setDailySchedules(prev => 
      prev.map(schedule => ({
        ...schedule,
        active: selectedSchedule.active,
        schedules: [...selectedSchedule.schedules]
      }))
    );

    // Success message removed

    setTimeout(() => {
      setAnimatingDays([]);
    }, 600);
  };

  if (loading || !habit) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const selectedSchedule = dailySchedules.find(s => s.day === selectedDay);
  const selectedDayName = DAYS_OF_WEEK.find(d => d.id === selectedDay)?.full;

  return (
    <div className="space-y-6 my-6">
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold">{habitTitle}</h1>
      </div>

      {/* Habit Details */}
      <div className="bg-white rounded-xl p-6 space-y-4">
        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              {habitIcon ? (
                <Icon icon={habitIcon} className="w-8 h-8 text-primary-500" />
              ) : (
                <HabitIcon 
                  icon={null} 
                  category={habitCategory} 
                  className="w-8 h-8 text-primary-500" 
                />
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowIconPicker(true)}
            >
              Change Icon
            </Button>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Habit Title
          </label>
          <Input
            id="title"
            value={habitTitle}
            onChange={e => setHabitTitle(e.target.value)}
            placeholder="Enter habit title"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <Input
            id="description"
            value={habitDescription}
            onChange={e => setHabitDescription(e.target.value)}
            placeholder="Enter habit description"
            maxLength={500}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={habitCategory}
            onChange={e => setHabitCategory(e.target.value as HabitCategory)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency
          </label>
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {habit?.habit?.frequency === 'daily' ? 'Daily' : 
                 habit?.habit?.frequency === 'days_per_week' ? 'Days per week' : 
                 habit?.habit?.frequency === 'times_per_week' ? 'Times per week' : 
                 habit?.habit?.frequency === 'after_meals' ? 'After meals' : 
                 habit?.habit?.frequency === 'times_per_day' ? 'Times per day' : 
                 habit?.habit?.frequency === 'specific_times' ? 'Specific times' : 
                 'Daily'}
              </span>
              <span className="text-xs text-gray-500">Read only</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Frequency cannot be changed after creation</p>
        </div>
        
        {/* Target */}
        {habit?.habit?.target && habit.habit.target.length > 0 && habit.habit && (
          <div>
            <HabitTargetSelector
              habit={habit.habit}
              selectedTarget={selectedHabitTarget}
              onSelectTarget={(target) => {
                setSelectedHabitTarget(target);
                if (habit.habit?.id) {
                  setSelectedTarget(habit.habit.id, target);
                }
              }}
              selectedTargets={selectedTargets}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Active</h2>
            <p className="text-sm text-gray-500">Turn this habit on or off</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isActive}
              onChange={e => handleToggleActive(e.target.checked)}
              disabled={isSaving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
          </label>
        </div>
      </div>

      {isActive && (
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
              const schedule = dailySchedules.find(s => s.day === day.id);
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
                      ? 'bg-[#4CAF50] text-white' // Active: Full green
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200' // Inactive: Gray
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

          {selectedSchedule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{selectedDayName}</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedSchedule.active}
                    onChange={() => toggleDay(selectedDay)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                </label>
              </div>

              {selectedSchedule.active && (
                <div className="space-y-4">
                  {selectedSchedule.schedules.map((schedule, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 gap-3">
                        {/* Label */}
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                              Label
                            </label>
                            {selectedSchedule.schedules.length > 1 && (
                              <button
                                onClick={() => removeSchedule(selectedDay, index)}
                                className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                                title="Remove time"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <Input
                            value={schedule.label || ''}
                            onChange={e => updateSchedule(selectedDay, index, 'label', e.target.value || null)}
                            placeholder={`Time ${index + 1}`}
                            className="mb-2"
                          />
                        </div>
                        
                        {/* Event Time */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Event Time
                          </label>
                          <input
                            type="time"
                            value={schedule.event_time}
                            onChange={e => updateSchedule(selectedDay, index, 'event_time', e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-full"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'textfield',
                            }}
                          />
                        </div>

                        {/* Reminder */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-600">
                              Reminder
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={schedule.reminder_time !== null}
                                onChange={e => {
                                  if (e.target.checked) {
                                    // Set reminder time to 5 minutes before event time
                                    const eventTime = schedule.event_time;
                                    const [hours, minutes] = eventTime.split(':').map(Number);
                                    
                                    // Calculate 5 minutes before
                                    let newMinutes = minutes - 5;
                                    let newHours = hours;
                                    
                                    // Handle minute underflow
                                    if (newMinutes < 0) {
                                      newMinutes = 60 + newMinutes;
                                      newHours = newHours - 1;
                                      // Handle hour underflow
                                      if (newHours < 0) {
                                        newHours = 23;
                                      }
                                    }
                                    
                                    // Format back to HH:MM
                                    const reminderTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
                                    
                                    updateSchedule(selectedDay, index, 'reminder_time', reminderTime);
                                  } else {
                                    updateSchedule(selectedDay, index, 'reminder_time', null);
                                  }
                                }}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                            </label>
                          </div>
                          
                          {schedule.reminder_time !== null && (
                            <input
                              type="time"
                              value={schedule.reminder_time}
                              onChange={e => updateSchedule(selectedDay, index, 'reminder_time', e.target.value)}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-full"
                              style={{
                                WebkitAppearance: 'none',
                                MozAppearance: 'textfield',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSchedule(selectedDay)}
                    className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Time
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Button 
            onClick={handleSave} 
            className="w-full"
            isLoading={isSaving}
            disabled={!hasUnsavedChanges}
          >
            {hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingNavigation(false);
        }}
        title="Unsaved Changes"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You have unsaved changes. Would you like to save them before leaving?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingNavigation(false);
                if (nextNavigationPage === -1){
                    navigate(-1);
                    return;
                }
                navigate('/')
                setActiveTab(nextNavigationPage as string);
              }}
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save & Exit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        isOpen={showIconPicker}
        onClose={() => {
          setShowIconPicker(false);
          setIconSearch('');
          setIconResults([]);
        }}
        title="Select Icon"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              value={iconSearch}
              onChange={e => handleIconSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-10"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {loadingIcons ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : iconResults.length > 0 ? (
            <div className="grid grid-cols-6 gap-2">
              {iconResults.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => selectIcon(icon)}
                  className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <Icon icon={icon} className="w-6 h-6" />
                </button>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              {iconSearch ? 'No icons found' : 'Start typing to search icons'}
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
