import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Tabs } from './ui/Tabs';
import { HabitCategories } from './habits/HabitCategories';
import { BottomNav } from './ui/BottomNav';
import { DateNavigation } from './plan/DateNavigation';
import { useState, useEffect, useMemo } from 'react';
import type { HabitCategory } from '../types/database';
import { useDebugStore } from '../stores/debugStore';
import { Avatar } from './ui/Avatar';
import { DebugPanel } from './DebugPanel';
import useAppStore from '../stores/appStore';
import packageJson from '../../package.json';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasUnsavedChanges, setShowConfirmDialog, setPendingNavigation, setNextNavigationPage, activeTab,setActiveTab, setHasUnsavedChanges } =
    useAppStore();
  
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
  }, [location.pathname, setActiveTab]);
  
  // Listen for custom event to change category
  useEffect(() => {
    const handleCategoryChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ category: string }>;
      const category = customEvent.detail?.category;
      
      if (category && ['eat', 'move', 'mind', 'sleep'].includes(category)) {
        console.log('Layout received category change event:', category);
        setActiveCategory(category as HabitCategory);
      }
    };
    
    window.addEventListener('change-habit-category', handleCategoryChange as EventListener);
    
    return () => {
      window.removeEventListener('change-habit-category', handleCategoryChange as EventListener);
    };
  }, []);


  useEffect(() => {
    setPendingNavigation(false);
    setShowConfirmDialog(false);
    setNextNavigationPage(-1);
    setHasUnsavedChanges(false);
  }, [activeTab, setShowConfirmDialog, setNextNavigationPage, setHasUnsavedChanges, setPendingNavigation]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return; // Prevent infinite loop

    if(hasUnsavedChanges) {
        setShowConfirmDialog(true);
        setPendingNavigation(true);
        setNextNavigationPage(tab);
        return
    }

    setActiveTab(tab);
    
    if (location.pathname.startsWith('/habits/')) {
      setTimeout(() => {
        navigate('/');
      }, 0);
    }
  };

  const tabs = useMemo(() => [
    { id: 'goal', label: 'Goal' },
    { id: 'plan', label: 'Plan' },
    { id: 'habits', label: 'Habits' },
  ], []);

  // Calculate header height based on active tab and screen size
  const getHeaderHeight = () => {
    // Base height for top bar and tabs - responsive
    let height = window.innerWidth < 640 ? 60 + 48 : 72 + 56; // Smaller on mobile

    // Add height for additional navigation elements
    if (activeTab === 'habits') {
      height += window.innerWidth < 640 ? 40 : 48; // Height for habit categories
    } else if (activeTab === 'plan') {
      height += window.innerWidth < 640 ? 40 : 48; // Height for date navigation
    }

    // Add extra padding
    height += window.innerWidth < 640 ? 12 : 16; // Less padding on mobile

    return height;
  };

  return (
    <div className="min-h-screen bg-[#F6F9FF]">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b shadow-sm">
        {/* Adjusted container width to better utilize space on larger phones */}
        <div className="w-full max-w-full sm:max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top Bar */}
          <div className="h-[60px] sm:h-[72px] flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-fluid-xl sm:text-fluid-2xl">ADAPT</h1>
              {user?.is_admin && (
                <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/admin/habits"
                className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Admin
              </Link>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700"
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
          <div className="py-3 sm:py-4 space-y-2 sm:space-y-3">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
            />
            
            {activeTab === 'habits' && (
              <HabitCategories
                activeCategory={activeCategory}
                onCategoryChange={(newCategory) => {
                  console.log('[Layout] Setting activeCategory:', newCategory);
                  setActiveCategory(newCategory);
                }}
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

      {/* Main Content - Adjusted to better utilize space on larger phones */}
      <main
        className="w-full max-w-full sm:max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 pb-24"
        style={{ paddingTop: `${getHeaderHeight()}px` }}
      >
        <Outlet context={{ activeTab, activeCategory, selectedDate }} />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Debug Panel */}
      {showDebug && <DebugPanel />}

      {/* Version Number Display */}
      <footer className="fixed bottom-0 right-0 m-2 p-1 bg-gray-100 text-xs text-gray-600 rounded shadow-inner select-none pointer-events-none z-50">
        v{packageJson.version}
      </footer>
    </div>
  );
}
