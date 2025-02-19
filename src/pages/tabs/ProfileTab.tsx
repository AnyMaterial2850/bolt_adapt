import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { ProfileField } from '../../components/profile/ProfileField';
import { WeightTracker } from '../../components/profile/WeightTracker';
import { format, parseISO } from 'date-fns';
import { PhoneInput } from '../../components/profile/PhoneInput';

interface ProfileTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileTab({ onToast }: ProfileTabProps) {
  const { user, loadUser } = useAuthStore();
  const { addLog } = useDebugStore();
  const [isLoading, setIsLoading] = useState(false);

  // Debug log when component mounts and when user changes
  useEffect(() => {
    addLog('ProfileTab mounted', 'debug', {
      user: {
        ...user,
        sex: user?.sex || 'not set',
        mobile_number: user?.mobile_number || 'not set',
        mobile_country_code: user?.mobile_country_code || 'not set'
      }
    });
  }, [user, addLog]);

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      addLog(`Updating profile field: ${field}`, 'info', { 
        currentValue: user[field],
        newValue: value 
      });

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      await loadUser();
      addLog(`${field} updated successfully`, 'success', {
        newValue: value
      });
      onToast(`${field.replace('_', ' ')} updated successfully`, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to update ${field}`);
      addLog(`Failed to update ${field}`, 'error', { error });
      onToast(`Failed to update ${field}. Please try again.`, 'error');
      throw error;
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
                  } catch (err) {
                    onToast('Failed to update phone number', 'error');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weight Tracking */}
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">Weight Tracking</h3>
        <WeightTracker
          entries={[]}
          weightUnit={user?.preferred_weight_unit || 'kg'}
          onAddEntry={() => {}}
          onEditEntry={() => {}}
          onDeleteEntry={() => {}}
          onUnitChange={() => {}}
        />
      </div>
    </div>
  );
}