import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useHabitStore } from '../../stores/habitStore';
import { Button } from '../../components/ui/Button';
import type { Habit, HabitCategory } from '../../types/database';
import { HabitForm } from '../../components/admin/HabitForm';
import type { HabitFormData } from '../../utils/types';
import { CategoryFilter } from '../../components/admin/CategoryFilter';
import { HabitTable } from '../../components/admin/HabitTable';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Toast } from '../../components/ui/Toast';

export function ManageHabits() {
  const { user } = useAuthStore();
  const { 
    habits, 
    loadingHabits, 
    habitsError, 
    toast, 
    setToast,
    loadHabits, 
    createHabit, 
    updateHabit, 
    deleteHabit 
  } = useHabitStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: habits.length,
      eat: 0,
      move: 0,
      mind: 0,
      sleep: 0,
    };

    habits.forEach(habit => {
      counts[habit.category]++;
    });

    return counts;
  }, [habits]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleCreateHabit = async (formData: HabitFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const success = await createHabit(formData, user.id);
      if (success) {
        setIsCreating(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHabit = async (formData: HabitFormData) => {
    if (!editingHabit) return;
    setIsSubmitting(true);
    
    try {
      const success = await updateHabit(editingHabit.id, formData);
      if (success) {
        setIsEditing(false);
        setEditingHabit(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    
    const success = await deleteHabit(habitToDelete.id);
    if (success) {
      setHabitToDelete(null);
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditing(true);
    // Prevent default navigation
    return false;
  };

  if (!user?.is_admin) return null;

  return (
    <AdminLayout title="Manage Habits">
      <div className="space-y-6">
        {/* Only show habit count and create button when not creating or editing */}
        {!isCreating && !isEditing && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {habits.length} Total Habits
              </h2>
              <Button
                onClick={() => setIsCreating(true)}
                className="flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Habit
              </Button>
            </div>

            {habitsError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl">
                {habitsError}
              </div>
            )}
          </>
        )}

        {/* Create Habit Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 p-4 border-b">Create New Habit</h2>
            <HabitForm
              onSubmit={handleCreateHabit}
              onCancel={() => setIsCreating(false)}
              initialData={{
                title: '',
                description: '',
                category: selectedCategory === 'all' ? 'eat' : selectedCategory,
                icon: '',
                content_type: 'video',
                content_url: '',
                content_title: '',
                content_description: '',
                content_thumbnail_url: '',
                bottom_line_items: [{ title: '', type: 'link', url: '', description: '' }],
                go_deeper_titles: [],
                go_deeper_urls: [],
                frequency: 'daily',
                frequency_details: { daily: {} },
                target: [],
                unit: ''
              }}
              submitLabel="Create Habit"
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Edit Habit Form */}
        {isEditing && editingHabit && (
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 p-4 border-b">Edit Habit: {editingHabit.title}</h2>
            <HabitForm
              onSubmit={handleEditHabit}
              onCancel={() => {
                setIsEditing(false);
                setEditingHabit(null);
              }}
              initialData={{
                title: editingHabit.title,
                description: editingHabit.description || '',
                category: editingHabit.category,
                icon: editingHabit.icon || '',
                content_type: editingHabit.content_type || 'video',
                content_url: editingHabit.content_url || '',
                content_title: editingHabit.content_title || '',
                content_description: editingHabit.content_description || '',
                content_thumbnail_url: editingHabit.content_thumbnail_url || '',
                bottom_line_items: editingHabit.bottom_line_items || [],
                go_deeper_titles: editingHabit.go_deeper_titles.length ? editingHabit.go_deeper_titles : [],
                go_deeper_urls: editingHabit.go_deeper_urls.length ? editingHabit.go_deeper_urls : [],
                frequency: editingHabit.frequency || 'daily',
                frequency_details: editingHabit.frequency_details || { daily: {} },
                target: editingHabit.target || [],
                unit: editingHabit.unit || ''
              }}
              submitLabel="Save Changes"
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Only show category filters and habit table when not creating or editing */}
        {!isCreating && !isEditing && (
          <>
            {/* Category Filters */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Habits Table */}
            <HabitTable
              habits={selectedCategory === 'all' 
                ? habits 
                : habits.filter(habit => habit.category === selectedCategory)
              }
              onEdit={startEditing}
              onDelete={(habitId) => {
                const habit = habits.find(h => h.id === habitId);
                if (habit) setHabitToDelete(habit);
              }}
              isLoading={loadingHabits}
              disabled={false}
            />
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Delete Habit</h3>
            <p>Are you sure you want to delete <strong>{habitToDelete.title}</strong>? This will also delete all completions and user data associated with this habit.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setHabitToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteHabit}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
