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
import { parse } from 'date-fns';
import useAppStore from '../../stores/appStore';

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
  }[];
}

export function HabitConfiguration() {
  const navigate = useNavigate();
  const { habitId } = useParams();
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [loading, setLoading] = useState(true);
  const [habit, setHabit] = useState<UserHabit | null>(null);
  const [dailySchedules, setDailySchedules] = useState<DaySchedule[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const { showConfirmDialog, setShowConfirmDialog, setPendingNavigation
    , hasUnsavedChanges, setHasUnsavedChanges,  nextNavigationPage, setActiveTab,setNextNavigationPage

   } =
    useAppStore();

  const [animatingDays, setAnimatingDays] = useState<string[]>([]);

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
    try {
      setLoading(true);
      addLog('Loading habit configuration...', 'info');

      const { data, error } = await supabase
        .from('user_habits')
        .select(`
          *,
          habit:habits(*)
        `)
        .eq('id', habitId)
        .single();

      if (error) {
        addLog(`Error loading habit: ${error.message}`, 'error');
        throw error;
      }
      if (!data) {
        addLog('Habit not found', 'error');
        throw new Error('Habit not found');
      }

      addLog(`Loaded habit: ${data.habit?.title}`, 'success');
      setHabit(data);
      setIsActive(data.active);
      setHabitTitle(data.habit?.title || '');
      setHabitDescription(data.habit?.description || '');
      setHabitCategory(data.habit?.category || 'move');
      setHabitIcon(data.habit?.icon || null);
      
      if (!data.daily_schedules || !data.daily_schedules.length) {
        const defaultSchedules = DAYS_OF_WEEK.map(day => ({
          day: day.id,
          active: true,
          schedules: [{
            event_time: '09:00',
            reminder_time: null
          }]
        }));
        setDailySchedules(defaultSchedules);
        addLog('Initialized default schedules', 'info');
      } else {
        setDailySchedules(data.daily_schedules);
        addLog('Loaded existing schedules', 'info');
      }

    } catch (err) {
      console.error('Error loading habit:', err);
      addLog(`Failed to load habit: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [habitId, navigate, addLog, setHabit, setIsActive, setHabitTitle, setHabitDescription, setHabitCategory, setHabitIcon, setDailySchedules, setLoading]);
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

    try {
      setIsSaving(true);
      addLog(`${newActiveState ? 'Activating' : 'Deactivating'} habit...`, 'info');
      
      setIsActive(newActiveState);

      const { error } = await supabase
        .from('user_habits')
        .update({
          active: newActiveState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id);

      if (error) {
        setIsActive(!newActiveState);
        addLog(`Failed to update habit status: ${error.message}`, 'error');
        throw error;
      }

      setHabit(prev => prev ? { ...prev, active: newActiveState } : null);
      
      addLog(`Habit ${newActiveState ? 'activated' : 'deactivated'} successfully`, 'success');
      setToast({
        message: `Habit ${newActiveState ? 'activated' : 'deactivated'} successfully`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error toggling habit:', err);
      setToast({
        message: 'Failed to update habit status. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!habit || isSaving) return;

    try {
      setIsSaving(true);
      addLog('Saving habit changes...', 'info');

      // Validate schedules
      for (const daySchedule of dailySchedules) {
        if (daySchedule.active && (!daySchedule.schedules || daySchedule.schedules.length === 0)) {
          const error = `${daySchedule.day} must have at least one schedule when active`;
          addLog(error, 'error');
          throw new Error(error);
        }
        for (const schedule of daySchedule.schedules) {
          if (!schedule.event_time.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)) {
            const error = 'Invalid time format';
            addLog(error, 'error');
            throw new Error(error);
          }
          if (schedule.reminder_time) {
            const error = validateReminderTime(schedule.event_time, schedule.reminder_time);
            if (error) {
              addLog(error, 'error');
              throw new Error(error);
            }
          }
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
      setToast({
        message: 'Changes saved successfully',
        type: 'success'
      });

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

      setHasUnsavedChanges(false);

    setShowConfirmDialog(false);
    setPendingNavigation(false);
    if (nextNavigationPage === -1){
        navigate(-1);
        return;
    }
    navigate('/')
    setActiveTab(nextNavigationPage as string);
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
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=30`);
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

  const toggleDay = (dayId: string) => {
    setDailySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId
          ? { ...schedule, active: !schedule.active }
          : schedule
      )
    );
  };


  const addSchedule = (dayId: string) => {
    setDailySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId
          ? {
              ...schedule,
              schedules: [
                ...schedule.schedules,
                { event_time: '09:00', reminder_time: null }
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

    setDailySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId
          ? {
              ...schedule,
              schedules: schedule.schedules.map((timeSlot, i) => 
                i === index
                  ? { ...timeSlot, [field]: value }
                  : timeSlot
              )
            }
          : schedule
      )
    );
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

    setToast({
      message: `Copied ${selectedDayName}'s schedule to all days`,
      type: 'success'
    });

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
                    <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                          Time {index + 1}
                        </h4>
                        {selectedSchedule.schedules.length > 1 && (
                          <button
                            onClick={() => removeSchedule(selectedDay, index)}
                            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                            title="Remove time"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={schedule.event_time}
                            onChange={e => updateSchedule(selectedDay, index, 'event_time', e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-full my-3"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'textfield',
                            }}
                          />
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
                                checked={schedule.reminder_time !== null}
                                onChange={e => updateSchedule(
                                  selectedDay,
                                  index,
                                  'reminder_time',
                                  e.target.checked ? schedule.event_time : null
                                )}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4CAF50]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                            </label>
                          </div>
                          
                          {(
                            <input
                              type="time"
                              value={schedule?.reminder_time ?? ''}
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

      {/* ```tsx
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