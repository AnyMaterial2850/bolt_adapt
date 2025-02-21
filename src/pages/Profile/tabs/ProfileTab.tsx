import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { ProfileField } from '../../../components/profile/ProfileField';
import { WeightTracker } from '../../../components/profile/WeightTracker';
import { format, parseISO } from 'date-fns';
import { PhoneInput } from '../../../components/profile/PhoneInput';
import type { WeightEntry } from '../../../types/database';

interface ProfileTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileTab({ onToast }: ProfileTabProps) {
  const { user, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);

  // Load weight entries
  useEffect(() => {
    const loadWeightEntries = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false });

        if (error) throw error;
        setWeightEntries(data || []);
      } catch {
        onToast('Failed to load weight entries', 'error');
      }
    };

    loadWeightEntries();
  }, [user, onToast]);

  const handleAddWeightEntry = async (weight: string, date: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const weightValue = parseFloat(weight);
      
      if (isNaN(weightValue) || weightValue <= 0) {
        onToast('Please enter a valid weight', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('weight_entries')
        .insert([{
          user_id: user.id,
          weight: weightValue,
          recorded_at: date,
          unit: user.preferred_weight_unit || 'kg'
        }])
        .select()
        .single();

      if (error) throw error;

      // Add the new entry to the beginning of the list
      setWeightEntries(prev => [data, ...prev]);
      onToast('Weight entry added successfully', 'success');
    } catch {
      onToast('Failed to add weight entry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWeightEntry = async (entryId: string, weight: string, date: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const weightValue = parseFloat(weight);
      
      if (isNaN(weightValue) || weightValue <= 0) {
        onToast('Please enter a valid weight', 'error');
        return;
      }

      const { error } = await supabase
        .from('weight_entries')
        .update({
          weight: weightValue,
          recorded_at: date,
          unit: user.preferred_weight_unit || 'kg'
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWeightEntries(weightEntries.map(entry => 
        entry.id === entryId 
          ? { ...entry, weight: weightValue, recorded_at: date, unit: user.preferred_weight_unit || 'kg' }
          : entry
      ));
      onToast('Weight entry updated successfully', 'success');
    } catch {
      onToast('Failed to update weight entry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWeightEntry = async (entryId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWeightEntries(weightEntries.filter(entry => entry.id !== entryId));
      onToast('Weight entry deleted successfully', 'success');
    } catch{
      onToast('Failed to delete weight entry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (field: string, value: string | null) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      await loadUser();
      onToast(`${field.replace('_', ' ')} updated successfully`, 'success');
    } catch {
      onToast(`Failed to update ${field}. Please try again.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Personal Information</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <ProfileField
            icon={<User className="w-5 h-5 text-gray-400" />}
            label="First Name"
            value={user?.first_name || ''}
            placeholder="Add first name"
            onSave={(value) => handleUpdateProfile('first_name', value)}
            maxLength={50}
          />

          <ProfileField
            icon={<User className="w-5 h-5 text-gray-400" />}
            label="Last Name"
            value={user?.last_name || ''}
            placeholder="Add last name"
            onSave={(value) => handleUpdateProfile('last_name', value)}
            maxLength={50}
          />

          <div className="border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3 mb-1">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Sex</span>
            </div>
            <div className="pl-8 space-y-2">
              <select
                value={user?.sex || ''}
                onChange={(e) => handleUpdateProfile('sex', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                <option value="">Select your sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p className="text-sm text-gray-500">
                We use this information to calculate appropriate hydration targets based on biological factors.
              </p>
            </div>
          </div>

          <ProfileField
            icon={<Calendar className="w-5 h-5 text-gray-400" />}
            label="Date of Birth"
            value={user?.date_of_birth ? format(parseISO(user.date_of_birth), 'yyyy-MM-dd') : ''}
            placeholder="Add date of birth"
            type="date"
            onSave={(value) => handleUpdateProfile('date_of_birth', value)}
          />

          <ProfileField
            icon={<Mail className="w-5 h-5 text-gray-400" />}
            label="Email"
            value={user?.email || ''}
            placeholder="Add email"
            onSave={(value) => handleUpdateProfile('email', value)}
          />

          <div className="border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3 mb-1">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Mobile</span>
            </div>
            <div className="pl-8">
              <PhoneInput
                value={user?.mobile_number || ''}
                countryCode={user?.mobile_country_code || ''}
                onSave={async (phoneNumber, countryCode) => {
                  try {
                    await handleUpdateProfile('mobile_number', phoneNumber);
                    await handleUpdateProfile('mobile_country_code', countryCode);
                    onToast('Phone number updated successfully', 'success');
                  } catch {
                    onToast('Failed to update phone number', 'error');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weight Tracking */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Weight Tracking</h3>
        </div>
        <div className="p-6">
          <WeightTracker
            entries={weightEntries}
            weightUnit={user?.preferred_weight_unit || 'kg'}
            onAddEntry={handleAddWeightEntry}
            onEditEntry={handleEditWeightEntry}
            onDeleteEntry={handleDeleteWeightEntry}
            onUnitChange={(unit) => handleUpdateProfile('preferred_weight_unit', unit)}
            targetWeight={user?.target_weight || null}
            onTargetWeightChange={(weight) => handleUpdateProfile('target_weight', weight?.toString() || null)}
          />
        </div>
      </div>
    </div>
  );
}