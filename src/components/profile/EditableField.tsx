import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '../ui/Input';

interface EditableFieldProps {
  value: string;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
  type?: string;
  pattern?: string;
  maxLength?: number;
}

export function EditableField({ value, placeholder, onSave, type = 'text', pattern, maxLength }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="group flex items-center justify-between py-2">
        <p className={`text-gray-700 flex-1 ${!value && 'text-gray-400'}`}>
          {value || placeholder}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className={`
            ml-3 p-1.5 rounded-full transition-all
            text-gray-400 hover:text-gray-600 hover:bg-gray-100
            md:opacity-0 md:group-hover:opacity-100
          `}
          aria-label="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        type={type}
        pattern={pattern}
        maxLength={maxLength}
        autoFocus
      />
      <div className="flex items-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 text-success-500 hover:text-success-600 rounded-full hover:bg-success-50"
          aria-label="Save"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => {
            setEditValue(value);
            setIsEditing(false);
          }}
          disabled={isSaving}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}