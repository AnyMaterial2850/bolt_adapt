import { useState } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { useDebugStore } from '../../../stores/debugStore';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
}

export function IconPicker({ isOpen, onClose, onSelect }: IconPickerProps) {
  const { addLog } = useDebugStore();
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<string[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  const searchIcons = async (query: string) => {
    if (!query) {
      setIconResults([]);
      return;
    }

    setLoadingIcons(true);
    try {
      addLog('Searching icons...', 'info');
      // Restrict search to only Material Design Icons (MDI) set for consistency
      const response = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefix=mdi&limit=30`);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
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
                onClick={() => onSelect(icon)}
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
  );
}
