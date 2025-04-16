import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { HABIT_CATEGORIES, HabitCategory } from '../../config/categories';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Update pill position when active tab changes or on window resize
  useEffect(() => {
    const updatePillPosition = () => {
      const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
      const activeTabElement = tabsRef.current[activeIndex];
      
      if (activeTabElement) {
        const containerLeft = activeTabElement.parentElement?.getBoundingClientRect().left || 0;
        const tabLeft = activeTabElement.getBoundingClientRect().left;
        const relativeLeft = tabLeft - containerLeft;
        const newStyle = {
          left: relativeLeft,
          width: activeTabElement.offsetWidth,
        };
        setPillStyle(prev => {
          if (prev.left !== newStyle.left || prev.width !== newStyle.width) {
            return newStyle;
          }
          return prev;
        });
      }
    };
    
    updatePillPosition();
    
    // Add resize listener to handle responsive layout changes
    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [activeTab, tabs]);

  // Mapping of tab IDs to background colors
  const backgroundColors: Record<HabitCategory, string> = {
    eat: 'bg-eat-500',
    move: 'bg-move-500', 
    mind: 'bg-mind-500',
    sleep: 'bg-sleep-500'
  };

  // Mapping of tab IDs to text colors
  const textColors: Record<HabitCategory, string> = {
    eat: 'text-eat-500',
    move: 'text-move-500', 
    mind: 'text-mind-500',
    sleep: 'text-sleep-500'
  };

  return (
    <div className={cn(
      "relative flex rounded-full p-1 max-w-full mx-auto",
      backgroundColors[activeTab as HabitCategory] || 'bg-primary-500'
    )}>
      {/* Animated pill background */}
      <div
        className="absolute bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out"
        style={{
          left: pillStyle.left,
          width: pillStyle.width,
          height: 'calc(100% - 8px)',
          top: '4px',
        }}
      />
      
      {/* Tab buttons */}
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={el => tabsRef.current[index] = el}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors",
            activeTab === tab.id 
              ? `${textColors[tab.id as HabitCategory]} font-bold` 
              : "text-white font-medium hover:text-white/90"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
