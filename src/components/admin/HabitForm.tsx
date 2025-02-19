import { useState } from 'react';
import { Plus, ExternalLink, Search, Upload, X, Link as LinkIcon, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { HabitIcon } from '../habits/HabitIcon';
import type { HabitCategory, HabitContentType, BottomLineItem } from '../../types/database';
import { useDebugStore } from '../../stores/debugStore';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

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

const CONTENT_TYPES: { value: HabitContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'link', label: 'Link', icon: <LinkIcon className="w-4 h-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" /> },
  { value: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
  { value: 'ppt', label: 'Presentation', icon: <FileText className="w-4 h-4" /> },
];

export function HabitForm({ onSubmit, onCancel, initialData, submitLabel }: HabitFormProps) {
  const { addLog } = useDebugStore();
  const [formData, setFormData] = useState<HabitFormData>(initialData || defaultFormState);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<string[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const searchIcons = async (query: string) => {
    if (!query) {
      setIconResults([]);
      return;
    }

    setLoadingIcons(true);
    try {
      addLog('Searching icons...', 'info');
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=30`);
      if (!response.ok) throw new Error('Failed to fetch icons');
      
      const data = await response.json();
      setIconResults(data.icons || []);
      addLog(`Found ${data.icons?.length || 0} icons`, 'success');
    } catch (err) {
      console.error('Error searching icons:', err);
      const message = err instanceof Error ? err.message : 'Failed to search icons';
      addLog(message, 'error');
      setIconResults([]);
    } finally {
      setLoadingIcons(false);
    }
  };

  const handleIconSearch = (value: string) => {
    setIconSearch(value);
    searchIcons(value);
  };

  const selectIcon = (icon: string) => {
    addLog(`Selected icon: ${icon}`, 'info');
    setFormData(prev => ({ ...prev, icon }));
    setShowIconPicker(false);
    setIconSearch('');
    setIconResults([]);
  };

  const addBottomLineItem = () => {
    setFormData(prev => ({
      ...prev,
      bottom_line_items: [
        ...prev.bottom_line_items,
        { title: '', type: 'link', url: '', description: '' }
      ]
    }));
  };

  const removeBottomLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bottom_line_items: prev.bottom_line_items.filter((_, i) => i !== index)
    }));
  };

  const updateBottomLineItem = (index: number, updates: Partial<BottomLineItem>) => {
    setFormData(prev => ({
      ...prev,
      bottom_line_items: prev.bottom_line_items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      addLog('No file selected', 'error');
      return;
    }

    const item = formData.bottom_line_items[index];
    const fileType = item.type;

    // Validate file type
    const validTypes = {
      'pdf': ['application/pdf'],
      'ppt': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'video': ['video/mp4', 'video/webm', 'video/ogg'],
    };

    if (!validTypes[fileType]?.includes(file.type)) {
      const error = `Invalid file type. Please upload a ${fileType.toUpperCase()} file.`;
      setUploadError(error);
      addLog(error, 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const error = 'File size must be less than 5MB';
      setUploadError(error);
      addLog(error, 'error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      addLog('Starting file upload...', 'info');

      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `habits/${fileName}`;

      addLog(`Uploading file to ${filePath}...`, 'info');

      // Upload file to storage
      const { data, error: uploadError } = await supabase.storage
        .from('habits')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data) {
        throw new Error('Upload succeeded but no data returned');
      }

      addLog('File uploaded successfully', 'success');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('habits')
        .getPublicUrl(filePath);

      addLog(`Generated public URL: ${publicUrl}`, 'info');

      // Update form data with public URL
      updateBottomLineItem(index, { url: publicUrl });
      
      setUploadError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setUploadError(message);
      addLog(`Upload error: ${message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const addGoDeeperField = () => {
    setFormData(prev => ({
      ...prev,
      go_deeper_titles: [...prev.go_deeper_titles, ''],
      go_deeper_urls: [...prev.go_deeper_urls, ''],
    }));
  };

  const removeGoDeeperField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      go_deeper_titles: prev.go_deeper_titles.filter((_, i) => i !== index),
      go_deeper_urls: prev.go_deeper_urls.filter((_, i) => i !== index),
    }));
  };

  const updateGoDeeperField = (index: number, field: 'title' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      [`go_deeper_${field}s`]: prev[`go_deeper_${field}s`].map((item, i) => 
        i === index ? value : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderBottomLineInput = (item: BottomLineItem, index: number) => {
    if (item.type === 'link' || item.type === 'video') {
      return (
        <div className="flex gap-2">
          <Input
            value={item.url}
            onChange={e => updateBottomLineItem(index, { url: e.target.value })}
            placeholder={item.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com'}
            type="url"
          />
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      );
    }

    // For file uploads (pdf, ppt, image)
    return (
      <div className="space-y-4">
        {item.url && (
          <div className="relative group">
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon 
                  icon={item.type === 'pdf' ? 'mdi:file-pdf-box' : 'mdi:file-powerpoint-box'} 
                  className="w-12 h-12 text-gray-400"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => updateBottomLineItem(index, { url: '' })}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <label className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors cursor-pointer">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-primary-600 hover:text-primary-500">
                  Click to upload
                </span>
                {' '}or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                {item.type === 'image' ? 'PNG, JPG, GIF up to 5MB' :
                 item.type === 'pdf' ? 'PDF document up to 5MB' :
                 'PowerPoint presentation up to 5MB'}
              </p>
            </div>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={e => handleFileUpload(e, index)}
              accept={
                item.type === 'image' ? 'image/*' :
                item.type === 'pdf' ? '.pdf' :
                '.ppt,.pptx'
              }
            />
          </label>
        </div>

        {uploadError && (
          <p className="text-sm text-red-600">{uploadError}</p>
        )}
      </div>
    );
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
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-900">The Bottom Line</h3>
          <Button
            type="button"
            onClick={addBottomLineItem}
            variant="secondary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {formData.bottom_line_items.map((item, index) => (
          <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeBottomLineItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={item.title}
                onChange={e => updateBottomLineItem(index, { title: e.target.value })}
                placeholder="Enter item title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Type
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateBottomLineItem(index, { 
                      type: type.value,
                      url: ''
                    })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                      item.type === type.value
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    )}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {item.type === 'link' ? 'URL' :
                 item.type === 'video' ? 'YouTube URL' :
                 `Upload ${item.type.toUpperCase()}`}
              </label>
              {renderBottomLineInput(item, index)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Input
                value={item.description || ''}
                onChange={e => updateBottomLineItem(index, { description: e.target.value })}
                placeholder="Enter a brief description"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Go Deeper Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-900">Go Deeper</h3>
          <Button
            type="button"
            onClick={addGoDeeperField}
            variant="secondary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>

        {formData.go_deeper_titles.map((title, index) => (
          <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700">Link {index + 1}</h4>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeGoDeeperField(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={title}
                onChange={e => updateGoDeeperField(index, 'title', e.target.value)}
                placeholder="Enter link title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.go_deeper_urls[index]}
                  onChange={e => updateGoDeeperField(index, 'url', e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
                {formData.go_deeper_urls[index] && (
                  <a
                    href={formData.go_deeper_urls[index]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
      <Modal
        isOpen={showIconPicker}
        onClose={() => {
          setShowIconPicker(false);
          setIconSearch('');
          setIconResults([]);
        }}
        title="Select Icon"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              value={iconSearch}
              onChange={e => handleIconSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-10"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {loadingIcons ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
          ) : iconResults.length > 0 ? (
            <div className="grid grid-cols-6 gap-2">
              {iconResults.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => selectIcon(icon)}
                  className="p-2 rounded hover:bg-gray-100 flex items-center justify-center"
                >
                  <Icon icon={icon} className="w-6 h-6" />
                </button>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              {iconSearch ? 'No icons found' : 'Start typing to search icons'}
            </div>
          )}
        </div>
      </Modal>
    </form>
  );
}