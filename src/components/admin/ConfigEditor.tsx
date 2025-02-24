import { useState } from 'react';
import { AlertTriangle, ChevronDown, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfigEditorProps {
  configKey: string;
  value: any;
  onChange: (value: string) => void;
  error?: string;
  preview?: React.ReactNode;
}

interface SeasonNames {
  winter: string;
  spring: string;
  summer: string;
  autumn: { 'en-US': string; 'en-GB': string };
}

const SEASON_NAMES: SeasonNames = {
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  autumn: { 'en-US': 'Fall', 'en-GB': 'Autumn' }
};

export function ConfigEditor({ configKey, value, onChange, error, preview }: ConfigEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [locale, setLocale] = useState(navigator.language);

  const getSeasonName = (season: keyof SeasonNames) => {
    if (season === 'autumn') {
      return SEASON_NAMES.autumn[locale.startsWith('en-US') ? 'en-US' : 'en-GB'];
    }
    return SEASON_NAMES[season];
  };

  const getEditorType = () => {
    switch (configKey) {
      case 'analysis_periods':
        return 'periods';
      case 'performance_thresholds':
        return 'thresholds';
      case 'scoring_weights':
        return 'weights';
      case 'seasonal_definitions':
        return 'seasons';
      default:
        return 'json';
    }
  };

  const renderPeriodEditor = () => {
    const periods = Array.isArray(value) ? value : [];
    
    return (
      <div className="space-y-4">
        {periods.map((period, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <input
                type="text"
                value={period.label}
                onChange={e => {
                  const newPeriods = [...periods];
                  newPeriods[index] = { ...period, label: e.target.value };
                  onChange(JSON.stringify(newPeriods));
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Period Label"
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                value={period.days}
                onChange={e => {
                  const newPeriods = [...periods];
                  newPeriods[index] = { ...period, days: parseInt(e.target.value) };
                  onChange(JSON.stringify(newPeriods));
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Days"
                min="1"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={period.is_default}
                onChange={e => {
                  const newPeriods = periods.map((p, i) => ({
                    ...p,
                    is_default: i === index ? e.target.checked : false
                  }));
                  onChange(JSON.stringify(newPeriods));
                }}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">Default</span>
            </div>
            <button
              onClick={() => {
                const newPeriods = periods.filter((_, i) => i !== index);
                onChange(JSON.stringify(newPeriods));
              }}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newPeriods = [
              ...periods,
              { days: 30, label: "New Period", is_default: false }
            ];
            onChange(JSON.stringify(newPeriods));
          }}
          className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Add Period
        </button>
      </div>
    );
  };

  const renderThresholdEditor = () => {
    const thresholds = typeof value === 'object' ? value : {};
    const levels = ['excellent', 'good', 'fair', 'poor'];

    return (
      <div className="space-y-4">
        {levels.map(level => (
          <div key={level} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-32 text-sm font-medium capitalize">{level}</div>
            <div className="flex-1">
              <input
                type="number"
                value={thresholds[level] || 0}
                onChange={e => {
                  const newThresholds = {
                    ...thresholds,
                    [level]: parseInt(e.target.value)
                  };
                  onChange(JSON.stringify(newThresholds));
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Threshold value"
                min="0"
                max="100"
              />
            </div>
            <div className="w-16 text-sm text-gray-500">%</div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeightEditor = () => {
    const weights = typeof value === 'object' ? value : {};
    const factors = ['completion', 'consistency', 'trend'];

    return (
      <div className="space-y-4">
        {factors.map(factor => (
          <div key={factor} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-32 text-sm font-medium capitalize">{factor}</div>
            <div className="flex-1">
              <input
                type="number"
                value={weights[factor] || 0}
                onChange={e => {
                  const newWeights = {
                    ...weights,
                    [factor]: parseFloat(e.target.value)
                  };
                  onChange(JSON.stringify(newWeights));
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Weight value"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
            <div className="w-16 text-sm text-gray-500">
              {((weights[factor] || 0) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total</span>
            <span className={cn(
              "font-bold",
              Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 0.001
                ? "text-green-600"
                : "text-red-600"
            )}>
              {(Object.values(weights).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSeasonEditor = () => {
    const seasons = typeof value === 'object' ? value : {};
    const seasonNames = ['winter', 'spring', 'summer', 'autumn'] as const;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="en-US">US English (Fall)</option>
            <option value="en-GB">British English (Autumn)</option>
          </select>
        </div>

        {seasonNames.map(season => (
          <div key={season} className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium capitalize">
                {getSeasonName(season)}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start Month</label>
                <select
                  value={seasons[season]?.start_month || 1}
                  onChange={e => {
                    const newSeasons = {
                      ...seasons,
                      [season]: {
                        ...seasons[season],
                        start_month: parseInt(e.target.value)
                      }
                    };
                    onChange(JSON.stringify(newSeasons));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString(locale, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End Month</label>
                <select
                  value={seasons[season]?.end_month || 1}
                  onChange={e => {
                    const newSeasons = {
                      ...seasons,
                      [season]: {
                        ...seasons[season],
                        end_month: parseInt(e.target.value)
                      }
                    };
                    onChange(JSON.stringify(newSeasons));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString(locale, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditor = () => {
    switch (getEditorType()) {
      case 'periods':
        return renderPeriodEditor();
      case 'thresholds':
        return renderThresholdEditor();
      case 'weights':
        return renderWeightEditor();
      case 'seasons':
        return renderSeasonEditor();
      default:
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={e => onChange(e.target.value)}
            className={cn(
              "w-full h-64 font-mono text-sm p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500",
              error ? "border-red-500" : "border-gray-300"
            )}
            spellCheck="false"
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {renderEditor()}
        {error && (
          <div className="mt-2 flex items-center text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      {preview && (
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full px-4 py-2 bg-gray-50 border-b flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Preview
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showPreview && "rotate-180"
            )} />
          </button>
          <div className={cn(
            "transition-all duration-200",
            showPreview ? "p-4" : "h-0"
          )}>
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}