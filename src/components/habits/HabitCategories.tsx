import { cn } from '../../lib/utils';
import { HabitCategory } from '../../types/database';
import { CATEGORY_CONFIG } from '../../config/categories';
import useAppStore from '../../stores/appStore';
import { useLocation, useNavigate } from 'react-router-dom';

interface HabitCategoriesProps {
  activeCategory: HabitCategory;
  onCategoryChange: (category: HabitCategory) => void;
}

export function HabitCategories({ activeCategory, onCategoryChange }: HabitCategoriesProps) {
  const { 
    hasUnsavedChanges, 
    setShowConfirmDialog, 
    setPendingNavigation, 
    setNextNavigationPage 
  } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're currently on a habit configuration page
  const isOnHabitConfig = location.pathname.startsWith('/habits/');
  
  const handleCategoryChange = (category: HabitCategory) => {
    // If already on this category, do nothing
    if (category === activeCategory) return;
    
    // If we're on a habit configuration page and have unsaved changes
    if (isOnHabitConfig && hasUnsavedChanges) {
      // Show confirm dialog and set pending navigation
      setShowConfirmDialog(true);
      setPendingNavigation(true);
      
      // Store the category we want to navigate to
      setNextNavigationPage(category);
      
      // Don't perform the actual navigation yet - it will happen after user confirms
    } else if (isOnHabitConfig) {
      // If we're on the configuration page but no unsaved changes, go back to main habits view
      navigate('/');
      // Then change the category (after a short delay to ensure navigation completes)
      setTimeout(() => {
        onCategoryChange(category);
      }, 50);
    } else {
      // Normal category change when not on a configuration page
      onCategoryChange(category);
    }
  };

  return (
    <div className="flex rounded-full bg-gray-100 p-1 max-w-full mx-auto">
      {Object.entries(CATEGORY_CONFIG).map(([id, config]) => (
        <button
          key={id}
          onClick={() => handleCategoryChange(id as HabitCategory)}
          className={cn(
            'flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors rounded-full',
            activeCategory === id
              ? `bg-${config.color}-500 text-white shadow-sm`
              : `text-gray-500 hover:text-${config.color}-500`
          )}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}
