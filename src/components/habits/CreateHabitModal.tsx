import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { HabitCategory } from '../../types/database';
import { HabitIcon } from './HabitIcon';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitCreated: () => void;
  category: HabitCategory;
}

export function CreateHabitModal({ isOpen, onClose, onHabitCreated, category }: CreateHabitModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      setError('');

      // Create the habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert([
          {
            title: title.trim(),
            description: description.trim() || null,
            category,
          },
        ])
        .select()
        .single();

      if (habitError) throw habitError;

      // Create the user_habit
      const { error: userHabitError } = await supabase
        .from('user_habits')
        .insert([
          {
            user_id: user.id,
            habit_id: habit.id,
            frequency_per_day: 1,
            active: false,
            daily_schedules: [
              { day: 'Mon', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Tue', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Wed', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Thu', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Fri', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Sat', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
              { day: 'Sun', active: true, schedules: [{ event_time: '09:00', reminder_time: null }] },
            ],
          },
        ]);

      if (userHabitError) throw userHabitError;

      onHabitCreated();
      onClose();
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Error creating habit:', err);
      setError('Failed to create habit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Custom Habit">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
            <HabitIcon 
              icon={null} 
              category={category} 
              className="w-8 h-8 text-primary-500"
            />
          </div>
          <div className="text-sm text-gray-600">
            Creating a custom habit in the <span className="font-medium uppercase">{category}</span> category
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Habit Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter habit title"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter habit description"
              maxLength={500}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Create Habit
          </Button>
        </div>
      </form>
    </Modal>
  );
}