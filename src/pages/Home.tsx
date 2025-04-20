import { useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { useAuthStore } from '../stores/authStore';
import { useHabitStore } from '../stores/habitStore';
import { useCompletionStore } from '../stores/completionStore';
import { HabitList } from '../components/habits/HabitList';
import { PlanTab } from '../components/plan/PlanTab';
import type { Habit, HabitCategory } from '../types/database';
import { Target, MessageCircle } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { Toast } from '../components/ui/Toast';

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'M', full: 'Monday' },
  { id: 'Tue', label: 'T', full: 'Tuesday' },
  { id: 'Wed', label: 'W', full: 'Wednesday' },
  { id: 'Thu', label: 'T', full: 'Thursday' },
  { id: 'Fri', label: 'F', full: 'Friday' },
  { id: 'Sat', label: 'S', full: 'Saturday' },
  { id: 'Sun', label: 'S', full: 'Sunday' },
];

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
  const {
    habits,
    userHabits,
    loadingHabits,
    loadingUserHabits,
    toast,
    setToast,
    loadHabits,
    loadUserHabits,
    addHabitToUser,
    removeHabitFromUser,
    toggleHabitActive,
    selectedTargets,
    setSelectedTarget
  } = useHabitStore();
  
  const {
    completions,
    loading: loadingCompletions,
    toggleCompletion,
    loadCompletions
  } = useCompletionStore();

  // Group notes by month
  const groupedNotes = user?.coaching_notes?.reduce((groups: Record<string, CoachingNote[]>, note: string, index: number) => {
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

    // Load all habits
    loadHabits();
    
    // Load user's habits
    loadUserHabits(user.id);
  }, [user, navigate, loadHabits, loadUserHabits]);
  
  // Centralized completion loading effect - the ONLY place completions are loaded
  useEffect(() => {
    // Only load completions if we have user habits and we're on the plan tab
    if (userHabits.length > 0 && activeTab === 'plan') {
      // The completionStore will internally check if we need to reload 
      // or if we already have this data loaded recently
      loadCompletions(userHabits.map(h => h.id), selectedDate);
    }
  }, [userHabits, selectedDate, activeTab, loadCompletions]);
  
  const handleToggleCompletion = async (habitId: string, date: Date, eventTime: string): Promise<boolean> => {
    try {
      const success = await toggleCompletion(habitId, date, eventTime);
      
      if (!success) {
        setToast({
          message: 'Failed to update habit completion. Please try again.',
          type: 'error'
        });
      }
      
      return success;
    } catch (error) {
      setToast({
        message: 'An error occurred while updating habit completion.',
        type: 'error'
      });
      return false;
    }
  };

  const handleAddHabit = async () => {
    // This is now handled automatically when loading habits
    await loadHabits();
  };

  const handleConfigureHabit = (habitId: string, userHabitId?: string) => {
    // Log the attempt to navigate
    console.log(`Attempting to navigate to habit configuration`, { habitId, userHabitId });
    
    try {
      // If we have a userHabitId, navigate to that (for user's habits)
      if (userHabitId) {
        // Use direct path navigation for maximum reliability
        const path = `/habits/${userHabitId}`;
        console.log(`Navigating to: ${path}`);
        
        // Navigate immediately without showing a toast
        navigate(path);
      } else {
        // For habits not yet added by the user, show a toast message
        setToast({
          message: 'Add this habit first to configure it',
          type: 'success'
        });
        
        // Try to add the habit automatically
        if (user) {
          addHabitToUser(user.id, habitId)
            .then(success => {
              if (success) {
                // Try to find the newly added habit
                const userHabit = userHabits.find(uh => uh.habit_id === habitId);
                if (userHabit) {
                  // Navigate to the configuration page
                  navigate(`/habits/${userHabit.id}`);
                }
              }
            });
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback if navigation fails
      setToast({
        message: 'Could not open habit configuration. Please try again.',
        type: 'error'
      });
    }
  };

  const handleAddOrRemoveUserHabit = async (habit: Habit, isSelected: boolean, userHabitId?: string) => {
    if (!user) return;
    
    if (isSelected) {
      // Set habit to inactive (previously this was removing)
      console.log(`Setting habit ${habit.id} to inactive`);
      await removeHabitFromUser(user.id, habit.id, userHabitId);
    } else {
      // Check if the habit already exists for this user but is inactive
      const existingHabit = userHabits.find(uh => uh.habit_id === habit.id);
      
      if (existingHabit) {
        // If it exists but is inactive, reactivate it
        console.log(`Reactivating existing habit ${habit.id}`);
        await toggleHabitActive(existingHabit.id, true);
        
        // Reload user habits to get the updated data
        await loadUserHabits(user.id);
      } else {
        // If it doesn't exist, add it as a new habit
        console.log(`Adding new habit ${habit.id}`);
        const success = await addHabitToUser(user.id, habit.id);
        
        if (success) {
          // Find the newly added user habit
          const userHabit = userHabits.find(uh => uh.habit_id === habit.id);
          
          // After adding, check if configuration is needed
          const needsConfig = !habit.target || habit.target.length === 0 || !habit.frequency;
          if (needsConfig && userHabit) {
            // Navigate to habit configuration using the user habit ID
            navigate(`/habits/${userHabit.id}`);
          }
        }
      }
    }
  };

  const handleSelectTarget = (habitId: string, target: number) => {
    setSelectedTarget(habitId, target);
  };

  return (
    <div className="space-y-6">
      {activeTab === 'goal' ? (
        <>
          {/* Goal Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden my-4">
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
        loadingCompletions || loadingUserHabits ? (
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
        loadingHabits || loadingUserHabits ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <HabitList
              habits={habits}
              userHabits={userHabits}
              category={activeCategory}
              onAddOrRemoveHabit={handleAddOrRemoveUserHabit}
              onAddHabit={handleAddHabit}
              onSelectTarget={handleSelectTarget}
              selectedTargets={selectedTargets}
              onConfigureHabit={handleConfigureHabit}
            />
          </>
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
