import { useAuthStore } from '../../../stores/authStore';
import { GoalSection } from '../../../components/profile/GoalSection';
import { supabase } from '../../../lib/supabase';
import { useDebugStore } from '../../../stores/debugStore';

interface ProgressTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function ProgressTab({ onToast }: ProgressTabProps) {
  const { user, loadUser } = useAuthStore();
  const { addLog } = useDebugStore();

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user) return;

    try {
      addLog(`Updating profile field: ${field}`, 'info', { value });

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      await loadUser();
      addLog(`${field} updated successfully`, 'success');
      onToast(`${field.replace('_', ' ')} updated successfully`, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to update ${field}`);
      addLog(`Failed to update ${field}`, 'error', { error });
      onToast(`Failed to update ${field}. Please try again.`, 'error');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Goal Section */}
      <GoalSection
        goalWhat={user?.goal_what}
        goalWhy={user?.goal_why}
        coachingNotes={user?.coaching_notes || []}
        onUpdateGoal={(goal) => handleUpdateProfile('goal_what', goal)}
        onUpdateWhy={(why) => handleUpdateProfile('goal_why', why)}
      />

      {/* Weight Progress Chart */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">Weight Progress</h3>
        <p className="text-gray-500 text-center py-4">
          Weight progress chart coming soon
        </p>
      </div>
    </div>
  );
}