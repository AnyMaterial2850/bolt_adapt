import { useState, useEffect } from 'react';
import { useDebugStore } from '../stores/debugStore';

/**
 * Hidden component that allows activating the debug panel in production
 * by tapping a specific area multiple times in quick succession
 */
export function DebugActivator() {
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const setDebugVisible = useDebugStore((state) => state.setVisible);
  
  // Reset tap count after a delay
  useEffect(() => {
    if (tapCount > 0) {
      const timer = setTimeout(() => {
        setTapCount(0);
      }, 3000); // Reset after 3 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [tapCount]);
  
  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    // Only count taps that happen within 1 second of each other
    if (timeSinceLastTap < 1000) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      // Activate debug panel after 7 taps
      if (newCount >= 7) {
        setDebugVisible(true);
        setTapCount(0);
      }
    } else {
      // Start a new sequence
      setTapCount(1);
    }
    
    setLastTapTime(now);
  };
  
  return (
    <div 
      className="fixed top-0 right-0 w-16 h-16 z-50 opacity-0"
      onClick={handleTap}
      aria-hidden="true"
    />
  );
}
