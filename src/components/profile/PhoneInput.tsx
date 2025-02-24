import { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Input';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onSave: (phoneNumber: string, countryCode: string) => Promise<void>;
}

export function PhoneInput({ value, countryCode, onSave }: PhoneInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(countryCode || '');
  const [number, setNumber] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!code || !number) {
      setIsEditing(false);
      return;
    }

    // Normalize country code (ensure it starts with +)
    const normalizedCode = code.startsWith('+') ? code : `+${code}`;

    if (number === value && normalizedCode === countryCode) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(number, normalizedCode);
      setIsEditing(false);
    } catch{
      setCode(countryCode || '');
      setNumber(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="group flex items-center justify-between py-2">
        <p className={cn(
          "text-gray-700 flex-1",
          !value && !countryCode && "text-gray-400"
        )}>
          {value && countryCode ? `${countryCode} ${value}` : 'Add phone number'}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className={cn(
            "ml-3 p-1.5 rounded-full transition-all",
            "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            "md:opacity-0 md:group-hover:opacity-100"
          )}
          aria-label="Edit phone number"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex gap-2">
        {/* Country Code Input */}
        <div className="w-24 flex-shrink-0">
          <Input
            value={code}
            onChange={(e) => {
              // Only allow + and numbers
              const value = e.target.value.replace(/[^\d+]/g, '');
              setCode(value);
            }}
            placeholder="+44"
            className="text-center"
            maxLength={4}
          />
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            value={number}
            onChange={(e) => {
              // Only allow numbers and spaces
              const value = e.target.value.replace(/[^\d\s]/g, '');
              setNumber(value);
            }}
            placeholder="7700 900000"
            maxLength={15}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          onClick={handleSave}
          disabled={isSaving || !code || !number}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            "text-success-500 hover:text-success-600 hover:bg-success-50",
            (isSaving || !code || !number) && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Save phone number"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => {
            setCode(countryCode || '');
            setNumber(value || '');
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