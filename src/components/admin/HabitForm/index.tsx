import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { HabitIcon } from '../../habits/HabitIcon';
import type { HabitCategory, HabitContentType, BottomLineItem } from '../../../types/database';
import { useDebugStore } from '../../../stores/debugStore';
import { IconPicker } from './IconPicker';
import { BottomLineSection } from './BottomLineSection';
import { GoDeeperSection } from './GoDeeperSection';

interface HabitFormProps {
  onSubmit: (data: HabitFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: HabitFormData;
  submitLabel: string;
}

export interface HabitFormData {
  title: string;
  description: string;
  category: HabitCategory;
  icon: string;
  content_type: HabitContentType | null;
  content_url: string;
  content_title: string;
  content_description: string;
  content_thumbnail_url: string;
  bottom_line_items: BottomLineItem[];
  go_deeper_titles: string[];
  go_deeper_urls: string[];
}

const defaultFormState: HabitFormData = {
  title: '',
  description: '',
  category: 'move',
  icon: '',
  content_type: null,
  content_url: '',
  content_title: '',
  content_description: '',
  content_thumbnail_url: '',
  bottom_line_items: [],
  go_deeper_titles: [''],
  go_deeper_urls: [''],
};

const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'eat', label: 'EAT' },
  { value: 'move', label: 'MOVE' },
  { value: 'mind', label: 'MIND' },
  { value: 'sleep', label: 'SLEEP' },
];

export function HabitForm({ onSubmit, onCancel, initialData, submitLabel }: HabitFormProps) {
  const { addLog } = useDebugStore();
  const [formData, setFormData] = useState<HabitFormData>(initialData || defaultFormState);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl shadow-sm space-y-6">
      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon
        </label>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            {formData.icon ? (
              <Icon icon={formData.icon} className="w-8 h-8 text-primary-500" />
            ) : (
              <HabitIcon 
                icon={null} 
                category={formData.category} 
                className="w-8 h-8 text-primary-500" 
              />
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowIconPicker(true)}
          >
            Change Icon
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <Input
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Input
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value as HabitCategory })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* The Bottom Line Section */}
      <BottomLineSection
        items={formData.bottom_line_items}
        onChange={items => setFormData({ ...formData, bottom_line_items: items })}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
        uploadError={uploadError}
        setUploadError={setUploadError}
      />

      {/* Go Deeper Section */}
      <GoDeeperSection
        titles={formData.go_deeper_titles}
        urls={formData.go_deeper_urls}
        onChange={(titles, urls) => setFormData({ 
          ...formData, 
          go_deeper_titles: titles,
          go_deeper_urls: urls
        })}
      />

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isUploading}>
          {submitLabel}
        </Button>
      </div>

      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={icon => {
          setFormData({ ...formData, icon });
          setShowIconPicker(false);
        }}
      />
    </form>
  );
}