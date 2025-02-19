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
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeIndex];
    
    if (activeTabElement) {
      const containerLeft = activeTabElement.parentElement?.getBoundingClientRect().left || 0;
      const tabLeft = activeTabElement.getBoundingClientRect().left;
      const relativeLeft = tabLeft - containerLeft;
      
      setPillStyle({
        left: relativeLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="relative flex rounded-full bg-primary-500 p-1">
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
            "relative flex-1 py-1.5 text-sm transition-colors",
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