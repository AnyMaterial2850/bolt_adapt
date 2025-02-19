import { Plus, ExternalLink, FileText, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { BottomLineItem, HabitContentType } from '../../../types/database';
import { supabase } from '../../../lib/supabase';
import { useDebugStore } from '../../../stores/debugStore';
import { cn } from '../../../lib/utils';

interface BottomLineSectionProps {
  items: BottomLineItem[];
  onChange: (items: BottomLineItem[]) => void;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
}

const CONTENT_TYPES: { value: HabitContentType; label: string; icon: React.ReactNode }[] = [
  { value: 'link', label: 'Link', icon: <LinkIcon className="w-4 h-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" /> },
  { value: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
];

export function BottomLineSection({ 
  items, 
  onChange,
  isUploading,
  setIsUploading,
  uploadError,
  setUploadError
}: BottomLineSectionProps) {
  const { addLog } = useDebugStore();

  const addItem = () => {
    onChange([
      ...items,
      { title: '', type: 'link', url: '', description: '' }
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<BottomLineItem>) => {
    onChange(items.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      addLog('No file selected', 'error');
      return;
    }

    const item = items[index];
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
      updateItem(index, { url: publicUrl });
      
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

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-900">The Bottom Line</h3>
        <Button
          type="button"
          onClick={addItem}
          variant="secondary"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
            <button
              type="button"
              onClick={() => removeItem(index)}
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
              onChange={e => updateItem(index, { title: e.target.value })}
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
                  onClick={() => updateItem(index, { 
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
            {item.type === 'link' || item.type === 'video' ? (
              <div className="flex gap-2">
                <Input
                  value={item.url}
                  onChange={e => updateItem(index, { url: e.target.value })}
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
            ) : (
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
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors cursor-pointer">
                    <div className="space-y-1 text-center">
                      <Plus className="mx-auto h-8 w-8 text-gray-400" />
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
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Input
              value={item.description || ''}
              onChange={e => updateItem(index, { description: e.target.value })}
              placeholder="Enter a brief description"
            />
          </div>
        </div>
      ))}
    </div>
  );
}