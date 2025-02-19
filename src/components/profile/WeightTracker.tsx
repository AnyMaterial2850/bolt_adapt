import { useState, useEffect } from 'react';
import { Pencil, Check, X, Trash2, Target } from 'lucide-react';
import { Input } from '../ui/Input';
import type { WeightEntry } from '../../types/database';
import { format } from 'date-fns';
import { useDebugStore } from '../../stores/debugStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface WeightTrackerProps {
  entries: WeightEntry[];
  weightUnit: 'kg' | 'lbs';
  onAddEntry: (weight: string, date: string) => Promise<void>;
  onEditEntry: (entryId: string, weight: string, date: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onUnitChange: (unit: 'kg' | 'lbs') => Promise<void>;
  targetWeight?: number | null;
  onTargetWeightChange?: (weight: number | null) => Promise<void>;
}

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

export function WeightTracker({ 
  entries: initialEntries, 
  weightUnit, 
  onAddEntry, 
  onEditEntry, 
  onDeleteEntry,
  onUnitChange,
  targetWeight,
  onTargetWeightChange
}: WeightTrackerProps) {
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [entries, setEntries] = useState<WeightEntry[]>(initialEntries);
  const [newWeight, setNewWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTargetWeight, setTempTargetWeight] = useState(targetWeight?.toString() || '');
  const [savingTarget, setSavingTarget] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load weight entries
  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;

      try {
        setLoading(true);
        addLog('Loading weight entries...', 'info');

        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false });

        if (error) throw error;

        setEntries(data || []);
        addLog(`Loaded ${data?.length || 0} weight entries`, 'success');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load weight entries';
        addLog(`Error loading weight entries: ${message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [user, addLog]);

  const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
    if (fromUnit === toUnit) return weight;
    return fromUnit === 'kg' 
      ? Number((weight * KG_TO_LBS).toFixed(1))
      : Number((weight * LBS_TO_KG).toFixed(1));
  };

  const handleTargetWeightSave = async () => {
    if (!onTargetWeightChange || savingTarget) return;
    
    try {
      setSavingTarget(true);
      const weight = tempTargetWeight ? parseFloat(tempTargetWeight) : null;
      
      if (weight !== null && (isNaN(weight) || weight <= 0)) {
        return;
      }
      
      await onTargetWeightChange(weight);
      setEditingTarget(false);
    } catch (err) {
      console.error('Failed to save target weight:', err);
    } finally {
      setSavingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Weight */}
      <div className="bg-white p-4 rounded-lg border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Target className="w-4 h-4" />
            Target Weight
          </div>
          {!editingTarget && (
            <button
              onClick={() => {
                setEditingTarget(true);
                setTempTargetWeight(targetWeight?.toString() || '');
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {targetWeight ? 'Change' : 'Set Target'}
            </button>
          )}
        </div>
        
        {editingTarget ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={tempTargetWeight}
              onChange={e => setTempTargetWeight(e.target.value)}
              placeholder={`Enter target weight in ${weightUnit}`}
              min="0"
              step="0.1"
              className="w-32"
            />
            <span className="text-sm text-gray-600">{weightUnit}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleTargetWeightSave}
                disabled={savingTarget}
                className="p-2 text-success-500 hover:text-success-600 rounded-full hover:bg-success-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTarget ? (
                  <div className="w-4 h-4 border-2 border-success-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingTarget(false);
                  setTempTargetWeight(targetWeight?.toString() || '');
                }}
                disabled={savingTarget}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-lg font-medium">
            {targetWeight ? (
              <span>{targetWeight} {weightUnit}</span>
            ) : (
              <span className="text-gray-400">No target set</span>
            )}
          </div>
        )}

        {targetWeight && entries.length > 0 && (
          <div className="text-sm text-gray-600">
            {entries[0].weight < targetWeight ? (
              <>
                <span className="font-medium">{(targetWeight - entries[0].weight).toFixed(1)} {weightUnit}</span> to go
              </>
            ) : entries[0].weight > targetWeight ? (
              <>
                <span className="font-medium">{(entries[0].weight - targetWeight).toFixed(1)} {weightUnit}</span> over target
              </>
            ) : (
              <span className="text-success-600 font-medium">Target reached! 🎉</span>
            )}
          </div>
        )}
      </div>

      {/* Unit Selection */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onUnitChange('kg')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            weightUnit === 'kg'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Kilograms (kg)
        </button>
        <button
          onClick={() => onUnitChange('lbs')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            weightUnit === 'lbs'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pounds (lbs)
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          type="number"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          placeholder={`Enter weight in ${weightUnit}`}
          min="0"
          step="0.1"
          className="flex-1"
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => onAddEntry(newWeight, selectedDate)}
          disabled={!newWeight}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              {editingEntry === entry.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder={`Enter weight in ${weightUnit}`}
                    min="0"
                    step="0.1"
                    className="w-32"
                    autoFocus
                  />
                  <input
                    type="date"
                    value={editDate || format(new Date(entry.recorded_at), 'yyyy-MM-dd')}
                    onChange={(e) => setEditDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEntry(entry.id, editWeight, editDate)}
                      className="p-2 text-success-500 hover:text-success-600 rounded-full hover:bg-success-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEntry(null);
                        setEditWeight('');
                        setEditDate('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">
                      {entry.unit === weightUnit 
                        ? entry.weight 
                        : convertWeight(entry.weight, entry.unit, weightUnit)
                      } {weightUnit}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {format(new Date(entry.recorded_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingEntry(entry.id);
                        setEditWeight(String(
                          entry.unit === weightUnit 
                            ? entry.weight 
                            : convertWeight(entry.weight, entry.unit, weightUnit)
                        ));
                        setEditDate(format(new Date(entry.recorded_at), 'yyyy-MM-dd'));
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          No weight entries yet
        </p>
      )}
    </div>
  );
}