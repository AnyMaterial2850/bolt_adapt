import { ExternalLink, FileText, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import type { Habit, BottomLineItem } from '../../types/database';
import { VideoPlayer } from '../video/VideoPlayer';
import { PDFViewer } from '../shared/PDFViewer';
import { HabitTargetSelector } from './HabitTargetSelector';
import { useState } from 'react';

interface HabitContentProps {
  habit: Habit;
  onSelectTarget?: (target: number) => void;
  selectedTarget?: number;
  selectedTargets: Record<string, number>;
}

export function HabitContent({ habit, onSelectTarget, selectedTarget, selectedTargets }: HabitContentProps) {
  const [localSelectedTarget, setLocalSelectedTarget] = useState<number | undefined>(selectedTarget);

  const handleSelectTarget = (target: number) => {
    setLocalSelectedTarget(target);
    if (onSelectTarget) {
      onSelectTarget(target);
    }
  };

  const renderContentItem = (item: BottomLineItem) => {
    switch (item.type) {
      case 'video':
        return (
          <div className="space-y-2 sm:space-y-3">
            <VideoPlayer 
              url={item.url} 
              title={item.title} 
            />
            {item.description && (
              <p className="text-xs sm:text-sm text-gray-600">
                {item.description}
              </p>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.url}
                alt={item.title}
                className="w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] object-contain"
                loading="lazy"
              />
            </div>
            {item.description && (
              <p className="text-xs sm:text-sm text-gray-600">
                {item.description}
              </p>
            )}
          </div>
        );

      case 'pdf':
      case 'ppt':
      case 'link':
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group space-y-1 sm:space-y-2"
          >
            <div className="flex items-center gap-2">
              {item.type === 'pdf' && (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              )}
              {item.type === 'ppt' && (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              )}
              {item.type === 'link' && (
                <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              )}
              <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                {item.title}
              </h4>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600" />
            </div>
            {item.description && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.type === 'pdf' && item.url && (
              <PDFViewer url={item.url} />
            )}
          </a>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Target Selector Section - only show if no target is selected yet */}
      {habit.target && 
       habit.target.length > 0 && 
       onSelectTarget && 
       (selectedTargets[habit.id] === undefined) && (
        <HabitTargetSelector
          habit={habit}
          selectedTarget={localSelectedTarget}
          onSelectTarget={handleSelectTarget}
          selectedTargets={selectedTargets}
        />
      )}

      {/* Main Content Section */}
      {habit.content_type && habit.content_url && (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            {habit.content_type === 'video' && (
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            )}
            {habit.content_type === 'image' && (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            )}
            {habit.content_type === 'pdf' && (
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            )}
            {habit.content_type === 'ppt' && (
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            )}
            {habit.content_type === 'link' && (
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            )}
            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
              Main Content
            </h3>
          </div>
          {renderContentItem({
            type: habit.content_type,
            url: habit.content_url,
            title: habit.content_title || 'View Resource',
            description: habit.content_description || undefined
          })}
        </div>
      )}

      {/* Bottom Line Section */}
      {habit.bottom_line_items && habit.bottom_line_items.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">The Bottom Line</h3>
          <div className="space-y-3 sm:space-y-4 text-left">
            {habit.bottom_line_items.map((item, index) => (
              <div key={index} className="text-left">
                {renderContentItem(item)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Go Deeper Section */}
      {habit.go_deeper_titles && habit.go_deeper_titles.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Go Deeper</h3>
          <div className="space-y-1 sm:space-y-2 text-left">
            {habit.go_deeper_titles.map((title, index) => (
              <a
                key={index}
                href={habit.go_deeper_urls[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-xs sm:text-sm"
              >
                <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
