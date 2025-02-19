import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Toast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import type { UserHabit } from '../../../types/database';
import { useDebugStore } from '../../../stores/debugStore';
import { BasicInfo } from './BasicInfo';
import { ScheduleSection } from './ScheduleSection';
import { validateReminderTime } from './utils';

export function HabitConfiguration() {
  const navigate = useNavigate();
  const { habitId } = useParams();
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [loading, setLoading] = useState(true);
  const [habit, setHabit] = useState<UserHabit | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  useEffect(() => {
    if (!user || !habitId) {
      addLog('No user or habit ID found, redirecting...', 'error');
      navigate(-1);
      return;
    }

    loadHabit();
  }, [user, habitId, navigate]);

  const loadHabit = async () => {
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
    } catch (err) {
      console.error('Error loading habit:', err);
      addLog(`Failed to load habit: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
      setPendingNavigation(true);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (!habit || isSaving) return;

    try {
      setIsSaving(true);
      addLog('Saving habit changes...', 'info');

      // Update habit details
      const { error: updateError } = await supabase
        .from('user_habits')
        .update({
          active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id);

      if (updateError) {
        addLog(`Failed to update habit: ${updateError.message}`, 'error');
        throw updateError;
      }

      addLog('Changes saved successfully', 'success');
      setToast({
        message: 'Changes saved successfully',
        type: 'success'
      });

      setHasUnsavedChanges(false);

      if (pendingNavigation) {
        setTimeout(() => {
          navigate(-1);
        }, 1000);
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

  if (loading || !habit) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold">{habit.habit?.title}</h1>
      </div>

      <BasicInfo
        habit={habit}
        isActive={isActive}
        onToggleActive={setIsActive}
        setHasUnsavedChanges={setHasUnsavedChanges}
      />

      {isActive && (
        <ScheduleSection
          habit={habit}
          setHabit={setHabit}
          setHasUnsavedChanges={setHasUnsavedChanges}
          setToast={setToast}
        />
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
                navigate(-1);
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