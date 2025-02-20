import { ExternalLink, FileText, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import type { Habit, BottomLineItem } from '../../types/database';
import { VideoPlayer } from '../video/VideoPlayer';

interface HabitContentProps {
  habit: Habit;
}

export function HabitContent({ habit }: HabitContentProps) {

  const renderContentItem = (item: BottomLineItem) => {
    switch (item.type) {
      case 'video':
        return (
          <div className="space-y-3">
            <VideoPlayer 
              url={item.url} 
              title={item.title} 
            />
            {item.description && (
              <p className="text-sm text-gray-600">
                {item.description}
              </p>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.url}
                alt={item.title}
                className="w-full max-h-[500px] object-contain mx-auto"
                loading="lazy"
              />
            </div>
            {item.description && (
              <p className="text-sm text-gray-600">
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
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="mt-1">
              {item.type === 'pdf' && (
                <FileText className="w-5 h-5 text-red-500" />
              )}
              {item.type === 'ppt' && (
                <FileText className="w-5 h-5 text-orange-500" />
              )}
              {item.type === 'link' && (
                <LinkIcon className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.title}
                </h4>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </a>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content Section */}
      {habit.content_type && habit.content_url && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {habit.content_type === 'video' && (
              <Video className="w-5 h-5 text-primary-500" />
            )}
            {habit.content_type === 'image' && (
              <ImageIcon className="w-5 h-5 text-primary-500" />
            )}
            {habit.content_type === 'pdf' && (
              <FileText className="w-5 h-5 text-primary-500" />
            )}
            {habit.content_type === 'ppt' && (
              <FileText className="w-5 h-5 text-primary-500" />
            )}
            {habit.content_type === 'link' && (
              <LinkIcon className="w-5 h-5 text-primary-500" />
            )}
            <h3 className="font-medium text-gray-900">
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
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">The Bottom Line</h3>
          <div className="space-y-4">
            {habit.bottom_line_items.map((item, index) => (
              <div key={index}>
                {renderContentItem(item)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Go Deeper Section */}
      {habit.go_deeper_titles && habit.go_deeper_titles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Go Deeper</h3>
          <div className="space-y-2">
            {habit.go_deeper_titles.map((title, index) => (
              <a
                key={index}
                href={habit.go_deeper_urls[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <LinkIcon className="w-4 h-4" />
                <span>{title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}