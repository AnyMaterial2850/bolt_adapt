import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isAfter, startOfDay, isBefore } from 'date-fns';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  // Get the start of the week (Monday)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const today = startOfDay(new Date());
  
  // Generate array of 7 days starting from weekStart
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onDateChange(addDays(selectedDate, -7))}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex-1 grid grid-cols-7 gap-1 px-2">
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const isPast = isBefore(date, today);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={`
                relative flex flex-col items-center justify-center h-14 rounded-lg
                transition-colors
                ${isSelected 
                  ? 'bg-primary-500 text-white' 
                  : isToday
                  ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  : isPast
                  ? 'text-gray-400 hover:bg-gray-100'
                  : 'text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <span 
                className={`
                  text-[10px] font-medium tracking-wider mb-1
                  ${isSelected ? 'text-white/90' : ''}
                `}
              >
                {format(date, 'EEE').toUpperCase()}
              </span>
              <span 
                className={`
                  text-[15px] leading-none
                  ${isSelected ? 'font-bold text-white' : isToday ? 'font-bold' : 'font-medium'}
                `}
              >
                {format(date, 'd')}
              </span>
              {isToday && !isSelected && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onDateChange(addDays(selectedDate, 7))}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}