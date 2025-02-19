import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import type { Habit, HabitCategory } from '../../types/database';
import { useDebugStore } from '../../stores/debugStore';
import { HabitForm, HabitFormData } from '../../components/admin/HabitForm';
import { CategoryFilter } from '../../components/admin/CategoryFilter';
import { HabitTable } from '../../components/admin/HabitTable';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Toast } from '../../components/ui/Toast';

export function ManageHabits() {
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      addLog('Loading habits...', 'info');

      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHabits(data || []);
      addLog(`Loaded ${data?.length || 0} habits`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load habits';
      setError(message);
      addLog(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (formData: HabitFormData) => {
    if (!user) return;

    try {
      addLog('Creating new habit...', 'info');
      
      const filteredGoDeeper = formData.go_deeper_titles.map((title, index) => ({
        title,
        url: formData.go_deeper_urls[index] || '',
      })).filter(item => item.title && item.url);

      // Filter out invalid bottom line items
      const validBottomLineItems = formData.bottom_line_items.filter(item => 
        item.title && item.type && item.url
      );

      const habitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        icon: formData.icon || null,
        content_type: formData.content_type,
        content_url: formData.content_url || null,
        content_title: formData.content_title || null,
        content_description: formData.content_description || null,
        content_thumbnail_url: formData.content_thumbnail_url || null,
        bottom_line_items: validBottomLineItems,
        go_deeper_titles: filteredGoDeeper.map(item => item.title),
        go_deeper_urls: filteredGoDeeper.map(item => item.url),
        owner_id: user.id
      };

      // Create habit first
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert([habitData])
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .single();

      if (habitError) throw habitError;

      // Upload images if any
      if (formData.images && formData.images.length > 0) {
        addLog('Uploading images...', 'info');
        const images = await uploadImages(habit.id, formData.images);
        habit.images = images;
      }

      addLog('Habit created successfully', 'success');
      setHabits([habit, ...habits]);
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating habit:', err);
      const message = err instanceof Error ? err.message : 'Failed to create habit';
      addLog(message, 'error');
      setError(message);
    }
  };

  const handleEditHabit = async (formData: HabitFormData) => {
    if (!editingHabit || !user) return;

    try {
      addLog('Updating habit...', 'info');
      
      const filteredGoDeeper = formData.go_deeper_titles.map((title, index) => ({
        title,
        url: formData.go_deeper_urls[index] || '',
      })).filter(item => item.title && item.url);

      // Filter out invalid bottom line items
      const validBottomLineItems = formData.bottom_line_items.filter(item => 
        item.title && item.type && item.url
      );

      const habitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        icon: formData.icon || null,
        content_type: formData.content_type,
        content_url: formData.content_url || null,
        content_title: formData.content_title || null,
        content_description: formData.content_description || null,
        content_thumbnail_url: formData.content_thumbnail_url || null,
        bottom_line_items: validBottomLineItems,
        go_deeper_titles: filteredGoDeeper.map(item => item.title),
        go_deeper_urls: filteredGoDeeper.map(item => item.url),
        owner_id: editingHabit.owner_id || user.id
      };

      // Update habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', editingHabit.id)
        .select(`
          *,
          habit_images (
            id,
            path,
            filename,
            size,
            created_at
          )
        `)
        .single();

      if (habitError) throw habitError;

      // Upload new images if any
      if (formData.images && formData.images.length > 0) {
        addLog('Uploading new images...', 'info');
        const images = await uploadImages(habit.id, formData.images);
        habit.images = [...(editingHabit.images || []), ...images];
      }

      addLog('Habit updated successfully', 'success');
      setHabits(habits.map(h => h.id === editingHabit.id ? habit : h));
      setIsEditing(false);
      setEditingHabit(null);
    } catch (err) {
      console.error('Error updating habit:', err);
      const message = err instanceof Error ? err.message : 'Failed to update habit';
      addLog(message, 'error');
      setError(message);
    }
  };

  const uploadImages = async (habitId: string, images: File[]) => {
    const uploadedImages = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${habitId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `habits/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('habits')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Insert image metadata
      const { data: imageData, error: insertError } = await supabase
        .from('habit_images')
        .insert({
          habit_id: habitId,
          path: filePath,
          filename: file.name,
          size: file.size,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      uploadedImages.push(imageData);
    }

    return uploadedImages;
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This will also delete all completions and user data associated with this habit.')) {
      return;
    }

    try {
      addLog('Deleting habit...', 'info');

      // Get the habit to be deleted
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        throw new Error('Habit not found');
      }

      // Delete all images from storage first
      if (habit.images?.length) {
        addLog('Deleting associated images...', 'info');
        for (const image of habit.images) {
          const { error: deleteError } = await supabase.storage
            .from('habits')
            .remove([image.path]);

          if (deleteError) {
            addLog(`Failed to delete image ${image.filename}`, 'error');
          }
        }
      }
      
      // Delete the habit (this will cascade to user_habits and completions)
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      addLog('Habit deleted successfully', 'success');
      setHabits(habits.filter(h => h.id !== habitId));
      setToast({
        message: 'Habit deleted successfully',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting habit:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete habit';
      addLog(message, 'error');
      setToast({
        message: 'Failed to delete habit. Please try again.',
        type: 'error'
      });
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit);
    setIsEditing(true);
  };

  if (!user?.is_admin) return null;

  return (
    <AdminLayout title="Manage Habits">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {habits.length} Total Habits
          </h2>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center"
            disabled={isEditing}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Habit
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl">
            {error}
          </div>
        )}

        {isCreating && (
          <HabitForm
            onSubmit={handleCreateHabit}
            onCancel={() => setIsCreating(false)}
            submitLabel="Create Habit"
          />
        )}

        {isEditing && editingHabit && (
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
              content_type: editingHabit.content_type,
              content_url: editingHabit.content_url || '',
              content_title: editingHabit.content_title || '',
              content_description: editingHabit.content_description || '',
              content_thumbnail_url: editingHabit.content_thumbnail_url || '',
              bottom_line_items: editingHabit.bottom_line_items || [],
              go_deeper_titles: editingHabit.go_deeper_titles.length ? editingHabit.go_deeper_titles : [''],
              go_deeper_urls: editingHabit.go_deeper_urls.length ? editingHabit.go_deeper_urls : [''],
            }}
            submitLabel="Save Changes"
          />
        )}

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
          onDelete={handleDeleteHabit}
          isLoading={loading}
          disabled={isCreating || isEditing}
        />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}