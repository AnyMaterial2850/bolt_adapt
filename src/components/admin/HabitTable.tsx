import { Edit2, Trash2, Link as LinkIcon, ChevronDown } from 'lucide-react';
import type { Habit } from '../../types/database';
import { HabitIcon } from '../habits/HabitIcon';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface HabitTableProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function HabitTable({ habits, onEdit, onDelete, isLoading, disabled }: HabitTableProps) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">No habits found matching the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th scope="col" className="relative px-6 py-3 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {habits.map(habit => (
              <tr 
                key={habit.id}
                className={cn(
                  'group hover:bg-gray-50 transition-colors',
                  expandedHabit === habit.id && 'bg-gray-50'
                )}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <HabitIcon 
                        icon={habit.icon} 
                        category={habit.category} 
                        className="text-primary-500"
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {habit.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                    {habit.category.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {habit.description || 'No description'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
                    className={cn(
                      "flex items-center text-sm text-primary-600 hover:text-primary-900 transition-colors",
                      !habit.content_url && !habit.bottom_line_items?.length && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!habit.content_url && !habit.bottom_line_items?.length}
                  >
                    View Content
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 ml-1 transition-transform duration-200",
                        expandedHabit === habit.id && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedHabit === habit.id && (
                    <div className="mt-4 space-y-4 bg-white rounded-lg border p-4">
                      {/* Main Content */}
                      {habit.content_url && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Main Content
                          </h4>
                          <a
                            href={habit.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            {habit.content_title || 'View Content'}
                          </a>
                        </div>
                      )}

                      {/* Bottom Line Items */}
                      {habit.bottom_line_items?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            The Bottom Line
                          </h4>
                          <div className="space-y-2">
                            {habit.bottom_line_items.map((item, index) => (
                              <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                              >
                                <LinkIcon className="w-4 h-4 mr-1" />
                                {item.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Go Deeper Links */}
                      {habit.go_deeper_titles?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                            Go Deeper
                          </h4>
                          <div className="space-y-2">
                            {habit.go_deeper_titles.map((title, index) => (
                              <a
                                key={index}
                                href={habit.go_deeper_urls[index]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                              >
                                <LinkIcon className="w-4 h-4 mr-1" />
                                {title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(habit)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={disabled}
                      title="Edit habit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(habit.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={disabled}
                      title="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-4 p-4">
        {habits.map(habit => (
          <div key={habit.id} className="border rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <HabitIcon 
                    icon={habit.icon} 
                    category={habit.category} 
                    className="text-primary-500"
                  />
                </div>
                <div>
                  <div className="font-semibold">{habit.title}</div>
                  <div className="text-xs mt-1 px-2 inline-block rounded-full bg-primary-100 text-primary-800">
                    {habit.category.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(habit)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={disabled}
                  title="Edit habit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(habit.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={disabled}
                  title="Delete habit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {habit.description && (
              <div className="text-sm text-gray-500">{habit.description}</div>
            )}
            {(habit.content_url || (habit.bottom_line_items && habit.bottom_line_items.length > 0)) && (
              <button
                onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-900 transition-colors"
              >
                View Content
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 ml-1 transition-transform duration-200",
                    expandedHabit === habit.id && "rotate-180"
                  )}
                />
              </button>
            )}
            {expandedHabit === habit.id && (
              <div className="mt-3 space-y-3 border-t pt-3">
                {habit.content_url && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Main Content
                    </h4>
                    <a
                      href={habit.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      {habit.content_title || 'View Content'}
                    </a>
                  </div>
                )}
                {habit.bottom_line_items?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      The Bottom Line
                    </h4>
                    <div className="space-y-2">
                      {habit.bottom_line_items.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          {item.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {habit.go_deeper_titles?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Go Deeper
                    </h4>
                    <div className="space-y-2">
                      {habit.go_deeper_titles.map((title, index) => (
                        <a
                          key={index}
                          href={habit.go_deeper_urls[index]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-primary-600 hover:text-primary-900"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          {title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
