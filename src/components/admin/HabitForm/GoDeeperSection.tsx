import { Plus, ExternalLink } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface GoDeeperSectionProps {
  titles: string[];
  urls: string[];
  onChange: (titles: string[], urls: string[]) => void;
}

export function GoDeeperSection({ titles, urls, onChange }: GoDeeperSectionProps) {
  const addField = () => {
    onChange([...titles, ''], [...urls, '']);
  };

  const removeField = (index: number) => {
    onChange(
      titles.filter((_, i) => i !== index),
      urls.filter((_, i) => i !== index)
    );
  };

  const updateField = (index: number, field: 'title' | 'url', value: string) => {
    if (field === 'title') {
      onChange(
        titles.map((item, i) => i === index ? value : item),
        urls
      );
    } else {
      onChange(
        titles,
        urls.map((item, i) => i === index ? value : item)
      );
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-900">Go Deeper</h3>
        <Button
          type="button"
          onClick={addField}
          variant="secondary"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Link
        </Button>
      </div>

      {titles.map((title, index) => (
        <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">Link {index + 1}</h4>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeField(index)}
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
              onChange={e => updateField(index, 'title', e.target.value)}
              placeholder="Enter link title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <div className="flex gap-2">
              <Input
                value={urls[index]}
                onChange={e => updateField(index, 'url', e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
              {urls[index] && (
                <a
                  href={urls[index]}
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
  );
}