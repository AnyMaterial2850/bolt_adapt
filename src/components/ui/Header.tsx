import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export function Header({ showBack, title }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="bg-white border-b">
      <div className="max-w-lg mx-auto px-4">
        {/* Top Bar */}
        <div className="h-[72px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">ADAPT</h1>
            {user?.is_admin && (
              <a
                href="/admin/habits"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Admin
              </a>
            )}
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}