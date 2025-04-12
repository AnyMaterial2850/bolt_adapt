import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

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
  console.log('[Tabs] Rendered with activeTab:', activeTab);

  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Update pill position when active tab changes or on window resize
  useEffect(() => {
    console.log('[Tabs] useEffect triggered with activeTab:', activeTab);

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

  return (
    <div className="relative flex rounded-full bg-primary-500 p-1 max-w-full mx-auto">
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
          onClick={() => {
            console.log('[Tabs] onClick tab.id:', tab.id, 'current activeTab:', activeTab);
            onChange(tab.id);
          }}
          className={cn(
            "relative flex-1 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors",
            activeTab === tab.id 
              ? "text-primary-500 font-bold" 
              : "text-white font-medium hover:text-white/90"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
