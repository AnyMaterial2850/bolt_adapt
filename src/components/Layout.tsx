import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Tabs } from './ui/Tabs';
import { HabitCategories } from './habits/HabitCategories';
import { BottomNav } from './ui/BottomNav';
import { DateNavigation } from './plan/DateNavigation';
import { useState, useEffect } from 'react';
import type { HabitCategory } from '../types/database';
import { useDebugStore } from '../stores/debugStore';
import { Avatar } from './ui/Avatar';
import { DebugPanel } from './DebugPanel';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('habits');
  const [activeCategory, setActiveCategory] = useState<HabitCategory>('move');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { isVisible: showDebug, setVisible: setShowDebug } = useDebugStore();

  // Sync tab state with route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      // Don't override the active tab on the home page
      // This allows the tab selection to work normally
      return;
    } else if (path.startsWith('/habits/')) {
      setActiveTab('habits');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    // First update the active tab
    setActiveTab(tab);
    
    // Then navigate if needed
    if (location.pathname.startsWith('/habits/')) {
      // Use a small timeout to ensure the tab updates before navigation
      setTimeout(() => {
        navigate('/');
      }, 0);
    }
  };

  const tabs = [
    { id: 'goal', label: 'Goal' },
    { id: 'plan', label: 'Plan' },
    { id: 'habits', label: 'Habits' },
  ];

  // Calculate header height based on active tab
  const getHeaderHeight = () => {
    // Base height for top bar and tabs
    let height = 72 + 56; // 72px for top bar, 56px for tabs padding and content

    // Add height for additional navigation elements
    if (activeTab === 'habits') {
      height += 48; // Height for habit categories
    } else if (activeTab === 'plan') {
      height += 48; // Height for date navigation
    }

    // Add extra padding
    height += 16; // 16px extra padding at bottom

    return height;
  };

  return (
    <div className="min-h-screen bg-[#F6F9FF]">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b">
        <div className="max-w-lg mx-auto px-4">
          {/* Top Bar */}
          <div className="h-[72px] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">ADAPT</h1>
              {user?.is_admin && (
                <div className="flex items-center space-x-3">
                  <a
                    href="/admin/habits"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Admin
                  </a>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Debug
                    </button>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="relative group"
            >
              <Avatar 
                src={user?.avatar_url}
                fallback={user?.email?.[0].toUpperCase() || 'A'}
                size="md"
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-primary-500 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Navigation */}
          <div className="py-4 space-y-3">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
            />
            
            {activeTab === 'habits' && (
              <HabitCategories
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            )}

            {activeTab === 'plan' && (
              <DateNavigation
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="mx-auto max-w-lg px-4 pb-24"
        style={{ paddingTop: `${getHeaderHeight()}px` }}
      >
        <Outlet context={{ activeTab, activeCategory, selectedDate }} />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Debug Panel */}
      {showDebug && <DebugPanel />}
    </div>
  );
}