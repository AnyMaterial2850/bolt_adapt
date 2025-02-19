import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { useDebugStore } from '../../stores/debugStore';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AnalysisPeriodEditor } from '../../components/admin/AnalysisPeriodEditor';
import { ConfigEditor } from '../../components/admin/ConfigEditor';

interface Config {
  analysis_periods: { days: number; label: string; is_default: boolean }[];
  performance_thresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  seasonal_definitions: {
    winter: { start_month: number; end_month: number };
    spring: { start_month: number; end_month: number };
    summer: { start_month: number; end_month: number };
    autumn: { start_month: number; end_month: number };
  };
  scoring_weights: {
    completion: number;
    consistency: number;
    trend: number;
  };
}

export function AnalyticsConfig() {
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [config, setConfig] = useState<Config>({
    analysis_periods: [{ days: 30, label: '30 Days', is_default: true }],
    performance_thresholds: {
      excellent: 90,
      good: 75,
      fair: 50,
      poor: 25
    },
    seasonal_definitions: {
      winter: { start_month: 12, end_month: 2 },
      spring: { start_month: 3, end_month: 5 },
      summer: { start_month: 6, end_month: 8 },
      autumn: { start_month: 9, end_month: 11 }
    },
    scoring_weights: {
      completion: 0.6,
      consistency: 0.3,
      trend: 0.1
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      addLog('Loading analytics configuration...', 'info');

      const { data, error } = await supabase
        .from('analytics_config')
        .select('*');

      if (error) throw error;

      const newConfig = { ...config };
      data.forEach((item: any) => {
        newConfig[item.key as keyof Config] = item.value;
      });

      setConfig(newConfig);
      addLog('Configuration loaded successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      addLog(message, 'error');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      addLog('Saving configuration changes...', 'info');

      // Update each configuration section
      for (const [key, value] of Object.entries(config)) {
        const { error } = await supabase
          .from('analytics_config')
          .update({ value })
          .eq('key', key);

        if (error) throw error;
      }

      setToast({
        message: 'Configuration saved successfully',
        type: 'success'
      });
      addLog('Configuration saved successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      addLog(message, 'error');
      setToast({
        message,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics Configuration">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Configuration">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Analysis Periods */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <AnalysisPeriodEditor
            periods={config.analysis_periods}
            onChange={periods => setConfig({ ...config, analysis_periods: periods })}
          />
        </div>

        {/* Performance Thresholds */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Thresholds</h3>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="mb-2">Define threshold levels for habit performance:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Excellent:</strong> Outstanding performance level</li>
              <li><strong>Good:</strong> Above average performance</li>
              <li><strong>Fair:</strong> Average performance</li>
              <li><strong>Poor:</strong> Needs improvement</li>
            </ul>
            <p className="mt-2 text-gray-500 italic">Values are percentages (0-100%)</p>
          </div>
          <ConfigEditor
            configKey="performance_thresholds"
            value={config.performance_thresholds}
            onChange={value => {
              try {
                setConfig({ ...config, performance_thresholds: JSON.parse(value) });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>

        {/* Seasonal Definitions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seasonal Definitions</h3>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="mb-2">Define the months that make up each season:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Winter:</strong> Typically December through February</li>
              <li><strong>Spring:</strong> Typically March through May</li>
              <li><strong>Summer:</strong> Typically June through August</li>
              <li><strong>Autumn:</strong> Typically September through November</li>
            </ul>
          </div>
          <ConfigEditor
            configKey="seasonal_definitions"
            value={config.seasonal_definitions}
            onChange={value => {
              try {
                setConfig({ ...config, seasonal_definitions: JSON.parse(value) });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>

        {/* Scoring Weights */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Scoring Weights</h3>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="mb-2">These weights determine how different factors contribute to the overall habit score:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Completion (60%):</strong> How often the habit is completed</li>
              <li><strong>Consistency (30%):</strong> How regularly the habit is maintained</li>
              <li><strong>Trend (10%):</strong> Recent improvement or decline</li>
            </ul>
            <p className="mt-2 text-gray-500 italic">Note: Weights must add up to 100%</p>
          </div>
          <ConfigEditor
            configKey="scoring_weights"
            value={config.scoring_weights}
            onChange={value => {
              try {
                setConfig({ ...config, scoring_weights: JSON.parse(value) });
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            isLoading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}