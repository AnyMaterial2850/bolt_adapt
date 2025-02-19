import { Input } from '../ui/Input';

interface AnalysisPeriodEditorProps {
  periods: { days: number }[];
  onChange: (periods: { days: number }[]) => void;
}

export function AnalysisPeriodEditor({ periods, onChange }: AnalysisPeriodEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Period</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set the number of days to analyze when calculating analytics
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={periods[0]?.days || 30}
            onChange={(e) => {
              const days = Math.min(999, Math.max(0, parseInt(e.target.value) || 0));
              onChange([{ days, label: `${days} Days`, is_default: true }]);
            }}
            min={0}
            max={999}
            className="w-24"
          />
          <span className="text-sm text-gray-600">Days</span>
        </div>
      </div>
    </div>
  );
}