import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { HabitList } from '../components/habits/HabitList';
import { PlanTab } from '../components/plan/PlanTab';
import { supabase } from '../lib/supabase';
import type { HabitCategory, UserHabit } from '../types/database';
import { Target, MessageCircle } from 'lucide-react';
import { format, isAfter, startOfDay, isFuture, parseISO, subMonths } from 'date-fns';
import { Toast } from '../components/ui/Toast';
import { useDebugStore } from '../stores/debugStore';

interface LayoutContext {
  activeTab: string;
  activeCategory: HabitCategory;
  selectedDate: Date;
}

interface CoachingNote {
  content: string;
  date: Date;
}

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeTab, activeCategory, selectedDate } = useOutletContext<LayoutContext>();
  const [userHabits, setUserHabits] = useState<UserHabit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [updatingCompletion, setUpdatingCompletion] = useState<string | null>(null);
  const { addLog } = useDebugStore();

  // Group notes by month
  const groupedNotes = user?.coaching_notes?.reduce((groups: Record<string, CoachingNote[]>, note, index) => {
    // For demo purposes, create dates going back from current date
    // In production, these dates would come from the database
    const date = subMonths(new Date(), index);
    const monthKey = format(date, 'MMMM yyyy');
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    
    groups[monthKey].push({
      content: note,
      date
    });
    
    return groups;
  }, {}) || {};

  // Sort months in reverse chronological order
  const sortedMonths = Object.keys(groupedNotes).sort((a, b) => {
    const dateA = parseISO(format(parseISO(a), 'yyyy-MM-dd'));
    const dateB = parseISO(format(parseISO(b), 'yyyy-MM-dd'));
    return dateB.getTime() - dateA.getTime();
  });

  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
      return;
    }

    loadHabits();
  }, [user, navigate, selectedDate]);

  const loadHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      addLog('Loading habits...', 'info');

      // Load all habits and create user habits if they don't exist
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*');

      if (habitsError) {
        addLog(`Failed to load habits: ${habitsError.message}`, 'error');
        throw habitsError;
      }

      addLog(`Found ${habits?.length || 0} habits`, 'success');

      // For each habit, get or create a user_habit
      const userHabitsPromises = habits.map(async (habit) => {
        const { data: existingUserHabit, error: userHabitError } = await supabase
          .from('user_habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('habit_id', habit.id)
          .single();

        if (userHabitError && userHabitError.code !== 'PGRST116') {
          addLog(`Error checking user habit: ${userHabitError.message}`, 'error');
          throw userHabitError;
        }

        if (!existingUserHabit) {
          addLog(`Creating user habit for habit ${habit.id}`, 'info');
          const { data: newUserHabit, error: createError } = await supabase
            .from('user_habits')
            .insert([{
              user_id: user.id,
              habit_id: habit.id,
              frequency_per_day: 1,
              active: false,
              daily_schedules: [
                { day: 'Mon', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Tue', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Wed', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Thu', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Fri', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Sat', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
                { day: 'Sun', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              ],
            }])
            .select()
            .single();

          if (createError) {
            addLog(`Failed to create user habit: ${createError.message}`, 'error');
            throw createError;
          }
          return { ...newUserHabit, habit };
        }

        return { ...existingUserHabit, habit };
      });

      const userHabitsData = await Promise.all(userHabitsPromises);
      addLog(`Loaded ${userHabitsData.length} user habits`, 'success');
      setUserHabits(userHabitsData);

      // Load completions for selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('date', dateStr);

      if (completionsError) {
        addLog(`Failed to load completions: ${completionsError.message}`, 'error');
        throw completionsError;
      }

      const completionsMap: Record<string, boolean> = {};
      completionsData?.forEach(completion => {
        const key = `${completion.user_habit_id}-${completion.date}-${completion.event_time}`;
        completionsMap[key] = true;
      });
      setCompletions(completionsMap);
      addLog('Loaded completions successfully', 'success');

    } catch (err) {
      console.error('Error loading habits:', err);
      const message = err instanceof Error ? err.message : 'Failed to load habits';
      addLog(`Error: ${message}`, 'error');
      setToast({
        message: 'Failed to load habits. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const habit = userHabits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      setUserHabits(prevHabits =>
        prevHabits.map(h =>
          h.id === habitId
            ? { ...h, active: !h.active }
            : h
        )
      );

      const { error } = await supabase
        .from('user_habits')
        .update({ active: !habit.active })
        .eq('id', habitId);

      if (error) {
        setUserHabits(prevHabits =>
          prevHabits.map(h =>
            h.id === habitId
              ? { ...h, active: habit.active }
              : h
          )
        );
        throw error;
      }
    } catch (err) {
      console.error('Error toggling habit:', err);
      setToast({
        message: 'Failed to update habit. Please try again.',
        type: 'error'
      });
    }
  };

  const handleToggleCompletion = async (habitId: string, date: Date, eventTime: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completionKey = `${habitId}-${dateStr}-${eventTime}`;

    // Prevent multiple clicks while updating
    if (updatingCompletion === completionKey) return;

    // Check if the date is in the future
    if (isFuture(startOfDay(date))) {
      setToast({
        message: "You can't track habits for future dates",
        type: 'error'
      });
      return;
    }

    const isCompleted = completions[completionKey];

    try {
      setUpdatingCompletion(completionKey);

      if (!isCompleted) {
        // First try to delete any existing completion for this habit and date
        await supabase
          .from('habit_completions')
          .delete()
          .eq('user_habit_id', habitId)
          .eq('date', dateStr)
          .eq('event_time', eventTime);

        // Then add the new completion
        const { error } = await supabase
          .from('habit_completions')
          .insert([{
            user_habit_id: habitId,
            date: dateStr,
            event_time: eventTime,
          }]);

        if (error) throw error;

        // Update local state
        setCompletions(prev => ({
          ...prev,
          [completionKey]: true
        }));

        setToast({
          message: 'Habit marked as completed',
          type: 'success'
        });
      } else {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('user_habit_id', habitId)
          .eq('date', dateStr)
          .eq('event_time', eventTime);

        if (error) throw error;

        // Update local state
        setCompletions(prev => {
          const newCompletions = { ...prev };
          delete newCompletions[completionKey];
          return newCompletions;
        });

        setToast({
          message: 'Habit marked as incomplete',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      setToast({
        message: 'Failed to update habit completion. Please try again.',
        type: 'error'
      });

      // Revert optimistic update
      if (!isCompleted) {
        setCompletions(prev => {
          const newCompletions = { ...prev };
          delete newCompletions[completionKey];
          return newCompletions;
        });
      } else {
        setCompletions(prev => ({
          ...prev,
          [completionKey]: true
        }));
      }
    } finally {
      setUpdatingCompletion(null);
    }
  };

  const handleAddHabit = async () => {
    // This is now handled automatically when loading habits
    await loadHabits();
  };

  return (
    <div className="space-y-6">
      {activeTab === 'goal' ? (
        <>
          {/* Goal Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Goal</h2>
                  <p className="text-sm text-gray-500">
                    Your health goal
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {user?.goal_what || 'No goal set yet'}
              </p>
            </div>
          </div>

          {/* Why Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Your why</h2>
                  <p className="text-sm text-gray-500">
                    Your motivation
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {user?.goal_why || 'No motivation set yet'}
              </p>
            </div>
          </div>

          {/* Coaching Notes Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Coach's Notes</h2>
                  <p className="text-sm text-gray-500">
                    Guidance from your health coach
                  </p>
                </div>
              </div>
              
              {sortedMonths.length > 0 ? (
                <div className="space-y-6">
                  {sortedMonths.map(month => (
                    <div key={month}>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {month}
                      </h3>
                      <div className="space-y-3">
                        {groupedNotes[month].map((note, index) => (
                          <div 
                            key={index}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <p className="text-gray-600 text-sm">{note.content}</p>
                            <span className="text-xs text-gray-400 mt-2 block">
                              {format(note.date, 'MMM d, yyyy')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">
                    No coaching notes yet. Your coach will add notes as you progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'plan' ? (
        loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <PlanTab
            habits={userHabits}
            onToggleCompletion={handleToggleCompletion}
            completions={completions}
          />
        )
      ) : activeTab === 'habits' ? (
        loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <HabitList
            habits={userHabits}
            category={activeCategory}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
          />
        )
      ) : null}

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