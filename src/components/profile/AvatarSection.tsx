import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';

interface AvatarSectionProps {
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

export function AvatarSection({ isUploading, setIsUploading }: AvatarSectionProps) {
  const { user, loadUser } = useAuthStore();
  const { addLog } = useDebugStore();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      addLog('Uploading avatar...', 'info');

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Upload file
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Reload user data
      await loadUser();
      addLog('Avatar updated successfully', 'success');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload avatar');
      addLog('Failed to upload avatar', 'error', { error });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group">
        <Avatar
          src={user?.avatar_url}
          fallback={user?.email?.[0].toUpperCase() || 'A'}
          size="lg"
          className="w-24 h-24"
        />
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          )}
        </label>
      </div>
      <h2 className="mt-4 text-base text-gray-600">{user?.email}</h2>
    </div>
  );
}