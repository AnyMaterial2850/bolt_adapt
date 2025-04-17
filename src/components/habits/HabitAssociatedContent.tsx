import { useState } from 'react';
import { BookOpen, FileText, Image, Link2, Video } from 'lucide-react';
import type { BottomLineItem, HabitContentType } from '../../types/database';

interface HabitAssociatedContentProps {
  bottomLineItems: BottomLineItem[];
  goDeeperTitles: string[];
  goDeeperUrls: string[];
}

export function HabitAssociatedContent({
  bottomLineItems,
  goDeeperTitles,
  goDeeperUrls
}: HabitAssociatedContentProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Render appropriate icon based on content type
  const getContentIcon = (type: HabitContentType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'ppt':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'link':
      default:
        return <Link2 className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleItemClick = (url: string) => {
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Bottom Line Items */}
      {bottomLineItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Bottom Line</h4>
          <ul className="space-y-2">
            {bottomLineItems.map((item, index) => (
              <li key={index}>
                <div>
                  <button
                    onClick={() => handleItemClick(item.url)}
                    className="flex items-center text-left space-x-2 w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {getContentIcon(item.type)}
                    <span className="text-sm font-medium text-gray-700">{item.title}</span>
                  </button>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1 px-3">
                      {expandedItem === `bl-${index}` ? (
                        <>
                          {item.description}
                          <button
                            onClick={() => setExpandedItem(null)}
                            className="ml-1 text-primary-500 hover:text-primary-700"
                          >
                            Show less
                          </button>
                        </>
                      ) : (
                        <>
                          {item.description.substring(0, 60)}
                          {item.description.length > 60 && (
                            <>
                              ...
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedItem(`bl-${index}`);
                                }}
                                className="ml-1 text-primary-500 hover:text-primary-700"
                              >
                                Show more
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Go Deeper Links */}
      {goDeeperUrls.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Go Deeper</h4>
          <ul className="space-y-2">
            {goDeeperUrls.map((url, index) => (
              <li key={index}>
                <button
                  onClick={() => handleItemClick(url)}
                  className="flex items-center text-left space-x-2 w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {index < goDeeperTitles.length ? goDeeperTitles[index] : `Resource ${index + 1}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {bottomLineItems.length === 0 && goDeeperUrls.length === 0 && (
        <div className="text-sm text-gray-500 italic text-center">
          No additional resources available
        </div>
      )}
    </div>
  );
}
