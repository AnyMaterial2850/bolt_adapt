import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { HabitList } from './HabitList';
import type { Habit, UserHabit, HabitCategory } from '../../types/database';

// Mock child components to isolate the HabitList logic
vi.mock('./HabitItem', () => ({
  // Add explicit prop types for clarity
  HabitItem: (props: { habit: { id: string; title: string }, isSelected: boolean }) => (
    <div data-testid="habit-item" data-habit-id={props.habit.id}>
      {/* Use title instead of name */}
      {props.habit.title} - {props.isSelected ? 'Selected' : 'Not Selected'}
    </div>
  ),
}));

vi.mock('./CreateHabitModal', () => ({
  CreateHabitModal: (props: any) => (
    props.isOpen ? <div data-testid="create-habit-modal">Create Modal Open</div> : null
  ),
}));

// Use 'title' instead of 'name' for Habit
const mockHabits: Habit[] = [
  { id: '1', title: 'Drink Water', category: 'eat', created_at: '', description: null, frequency: 'daily', frequency_details: {}, icon: null, target: [], content_type: null, content_url: null, content_title: null, content_description: null, content_thumbnail_url: null, bottom_line_items: [], go_deeper_titles: [], go_deeper_urls: [], updated_at: '', unit: null },
  { id: '2', title: 'Walk', category: 'move', created_at: '', description: null, frequency: 'daily', frequency_details: {}, icon: null, target: [], content_type: null, content_url: null, content_title: null, content_description: null, content_thumbnail_url: null, bottom_line_items: [], go_deeper_titles: [], go_deeper_urls: [], updated_at: '', unit: null },
  { id: '3', title: 'Read', category: 'mind', created_at: '', description: null, frequency: 'daily', frequency_details: {}, icon: null, target: [], content_type: null, content_url: null, content_title: null, content_description: null, content_thumbnail_url: null, bottom_line_items: [], go_deeper_titles: [], go_deeper_urls: [], updated_at: '', unit: null },
  { id: '4', title: 'Meditate', category: 'mind', created_at: '', description: null, frequency: 'daily', frequency_details: {}, icon: null, target: [], content_type: null, content_url: null, content_title: null, content_description: null, content_thumbnail_url: null, bottom_line_items: [], go_deeper_titles: [], go_deeper_urls: [], updated_at: '', unit: null },
];

// Use 'active' instead of 'is_active' for UserHabit and add missing required fields
const mockUserHabits: UserHabit[] = [
  { id: 'uh1', user_id: 'user1', habit_id: '3', created_at: '', active: true, frequency_per_day: 1, daily_schedules: [], updated_at: '' },
];

describe('HabitList Component', () => {
  const mockOnAddOrRemoveHabit = vi.fn();
  const mockOnAddHabit = vi.fn();
  const mockOnSelectTarget = vi.fn();

  // Clean up the DOM after each test
  afterEach(() => {
    cleanup();
  });

  it('renders habits for the selected category', () => {
    render(
      <HabitList
        habits={mockHabits}
        userHabits={mockUserHabits}
        category="mind" // Use lowercase
        onAddOrRemoveHabit={mockOnAddOrRemoveHabit}
        onAddHabit={mockOnAddHabit}
        onSelectTarget={mockOnSelectTarget}
        selectedTargets={{}}
      />
    );

    // Check that only habits from the 'Mind' category are rendered
    expect(screen.getAllByTestId('habit-item')).toHaveLength(2);
    expect(screen.getByText(/Read/)).toBeInTheDocument();
    expect(screen.getByText(/Meditate/)).toBeInTheDocument();
    expect(screen.queryByText(/Drink Water/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Walk/)).not.toBeInTheDocument();

    // Check if the correct habit is marked as selected
    expect(screen.getByText(/Read - Selected/)).toBeInTheDocument();
    expect(screen.getByText(/Meditate - Not Selected/)).toBeInTheDocument();

    // Check for the add button
    expect(screen.getByRole('button', { name: /add new habit/i })).toBeInTheDocument();
  });

  it('shows message when no habits exist for the category', () => {
    render(
      <HabitList
        habits={mockHabits}
        userHabits={mockUserHabits}
        category="sleep" // Use lowercase
        onAddOrRemoveHabit={mockOnAddOrRemoveHabit}
        onAddHabit={mockOnAddHabit}
        onSelectTarget={mockOnSelectTarget}
        selectedTargets={{}}
      />
    );

    expect(screen.getByText(/no habits in this category yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('habit-item')).not.toBeInTheDocument();
  });

  // Add more tests later for opening the modal, etc.
});
