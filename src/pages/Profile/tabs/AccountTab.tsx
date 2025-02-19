import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PaymentSection } from '../../../components/profile/PaymentSection';
import { SubscriptionSection } from '../../../components/profile/SubscriptionSection';
import { DeleteAccountSection } from '../../../components/profile/DeleteAccountSection';
import { useDebugStore } from '../../../stores/debugStore';

interface AccountTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function AccountTab({ onToast }: AccountTabProps) {
  const { addLog } = useDebugStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = async () => {
    setPasswordError('');

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      addLog('Updating password...', 'info');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      onToast('Password updated successfully', 'success');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addLog('Password updated successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordError(message);
      addLog(`Failed to update password: ${message}`, 'error');
    }
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
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Update Password
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Change your password to keep your account secure
                </p>
              </div>
              <Button onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            </div>
          )}
        </div>
      </div>

      <PaymentSection />
      <SubscriptionSection />
      <DeleteAccountSection />
    </div>
  );
}