import { EditableField } from './EditableField';

interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onSave: (value: string) => Promise<void>;
  type?: string;
  pattern?: string;
  maxLength?: number;
}

export function ProfileField({ 
  icon, 
  label, 
  value, 
  placeholder, 
  onSave,
  type = 'text',
  pattern,
  maxLength 
}: ProfileFieldProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 mb-1">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="pl-8">
        <EditableField
          value={value}
          placeholder={placeholder}
          onSave={onSave}
          type={type}
          pattern={pattern}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}