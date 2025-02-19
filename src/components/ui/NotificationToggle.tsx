import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Toast } from './Toast';
import { checkNotificationSupport, requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../../lib/notifications';
import { useDebugStore } from '../../stores/debugStore';

interface NotificationToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => Promise<void>;
  className?: string;
}

export function NotificationToggle({ enabled, onChange, className }: NotificationToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { addLog } = useDebugStore();

  const handleToggle = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      if (!enabled) {
        // Check notification support
        if (!checkNotificationSupport()) {
          throw new Error('Notifications are not supported in your browser');
        }

        // Request permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }

        // Subscribe to push notifications
        await subscribeToPushNotifications();
      } else {
        // Unsubscribe from push notifications
        await unsubscribeFromPushNotifications();
      }

      // Update habit notification settings
      await onChange(!enabled);

      setToast({
        message: `Notifications ${!enabled ? 'enabled' : 'disabled'} successfully`,
        type: 'success'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update notification settings';
      addLog(message, 'error');
      setToast({
        message,
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          enabled
            ? "bg-success-50 text-success-600 hover:bg-success-100"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          isUpdating && "opacity-50 cursor-wait",
          className
        )}
      >
        {isUpdating ? (
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : enabled ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {enabled ? 'Notifications On' : 'Notifications Off'}
        </span>
      </button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}