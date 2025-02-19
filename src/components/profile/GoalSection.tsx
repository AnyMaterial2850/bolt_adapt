import { Target } from 'lucide-react';
import { EditableField } from './EditableField';

interface GoalSectionProps {
  goalWhat: string | null;
  goalWhy: string | null;
  coachingNotes: string[];
  onUpdateGoal: (goal: string) => Promise<void>;
  onUpdateWhy: (why: string) => Promise<void>;
}

export function GoalSection({ 
  goalWhat, 
  goalWhy, 
  coachingNotes,
  onUpdateGoal,
  onUpdateWhy
}: GoalSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Target className="w-6 h-6 text-primary-500" />
        </div>
        <h3 className="text-lg font-medium">Your Goal</h3>
      </div>

      <div className="space-y-6">
        {/* Goal What */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">What do you want to achieve?</h4>
          <EditableField
            value={goalWhat || ''}
            placeholder="Set your health goal"
            onSave={onUpdateGoal}
          />
        </div>

        {/* Goal Why */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Why is this important to you?</h4>
          <EditableField
            value={goalWhy || ''}
            placeholder="Set your motivation"
            onSave={onUpdateWhy}
          />
        </div>

        {/* Coaching Notes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Coaching Notes</h4>
          {coachingNotes?.length ? (
            <div className="space-y-3">
              {coachingNotes.map((note, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <p className="text-sm text-gray-600">{note}</p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    Added on {new Date().toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No coaching notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}