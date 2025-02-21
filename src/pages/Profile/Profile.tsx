import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Toast } from '../../components/ui/Toast';
import { ProfileTab } from './tabs/ProfileTab';
import { ProgressTab } from './tabs/ProgressTab';
import { AccountTab } from './tabs/AccountTab';

type Tab = 'profile' | 'progress' | 'account';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 h-16 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Avatar and Email */}
        <div className="flex flex-col items-center mb-8">
          <Avatar
            src={user?.avatar_url}
            fallback={user?.email?.[0].toUpperCase() || 'A'}
            size="lg"
            className="w-24 h-24"
          />
          <h2 className="mt-4 text-base text-gray-600">{user?.email}</h2>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 p-1 rounded-full flex mb-6">
          {['profile', 'progress', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`
                flex-1 py-2 px-4 text-sm font-medium rounded-full transition-all
                ${activeTab === tab
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <ProfileTab onToast={handleToast} />}
        {activeTab === 'progress' && <ProgressTab onToast={handleToast} />}
        {activeTab === 'account' && <AccountTab onToast={handleToast} />}
      </div>

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
