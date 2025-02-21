import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PaymentSection } from '../../../components/profile/PaymentSection';
import { SubscriptionSection } from '../../../components/profile/SubscriptionSection';
import { DeleteAccountSection } from '../../../components/profile/DeleteAccountSection';

interface AccountTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export function AccountTab({ onToast }: AccountTabProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError('');
    setIsLoading(true);

    try {
      // Validate passwords
      if (passwordForm.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: passwordForm.currentPassword
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        return;
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      onToast('Password updated successfully', 'success');
      setIsChangingPassword(false);
      setPasswordForm(initialPasswordForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PasswordForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setPasswordError('');
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Password & Security</h3>
          </div>
        </div>
        
        <div className="p-6">
          {isChangingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  placeholder="Enter current password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handleInputChange('newPassword')}
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePasswordChange}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm(initialPasswordForm);
                    setPasswordError('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Change your password to keep your account secure.
              </p>
              <Button onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Section */}
      <SubscriptionSection />

      {/* Payment Section */}
      <PaymentSection />

      {/* Delete Account Section */}
      <DeleteAccountSection />
    </div>
  );
}