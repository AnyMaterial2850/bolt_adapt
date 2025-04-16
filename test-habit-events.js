// This script tests the habit events functionality
// It creates a habit with multiple events and tests marking them as complete

import { createClient } from '@supabase/supabase-js';

// Use actual Supabase URL and key from .env
const SUPABASE_URL = 'https://tukucvihlyqdxehzeodv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1a3VjdmlobHlxZHhlaHplb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjgxMTUsImV4cCI6MjA1NTA0NDExNX0.SZ4hLFWNfCdwt3QVJwh0uvVUbjdp1q9BC0-XkrXlwJ4';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

async function main() {
  try {
    console.log('Testing habit events functionality...');
    
    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (userError) throw userError;
    if (!users || users.length === 0) throw new Error('No users found');
    
    const userId = users[0].id;
    console.log(`Using test user ID: ${userId}`);
    
    // Create a test habit with multiple targets
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .insert({
        title: 'Test Multiple Events Habit',
        description: 'A habit with multiple events to test',
        category: 'eat',
        icon: '🍎',
        target: [1, 2, 3],
        unit: 'servings',
        owner_id: userId
      })
      .select()
      .single();
    
    if (habitError) throw habitError;
    console.log(`Created test habit: ${habit.id}`);
    
    // Add the habit to the user
    const defaultSchedules = [
      { day: 'Mon', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Tue', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Wed', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Thu', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Fri', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Sat', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] },
      { day: 'Sun', active: true, schedules: [{ event_time: '09:00', reminder_time: null, label: null }] }
    ];
    
    const { data: userHabit, error: userHabitError } = await supabase
      .from('user_habits')
      .insert({
        user_id: userId,
        habit_id: habit.id,
        active: true,
        daily_schedules: defaultSchedules,
      })
      .select()
      .single();
    
    if (userHabitError) throw userHabitError;
    console.log(`Added habit to user: ${userHabit.id}`);
    
    // Mark sub-events as complete
    const today = new Date().toISOString().split('T')[0];
    
    // Mark first sub-event as complete
    const { error: completeError1 } = await supabase
      .from('habit_comp_track')
      .insert({
        user_habit_id: userHabit.id,
        date: today,
        evt_time: '09:00-0',
        completed_at: new Date().toISOString()
      });
    
    if (completeError1) throw completeError1;
    console.log('Marked first sub-event as complete');
    
    // Mark second sub-event as complete
    const { error: completeError2 } = await supabase
      .from('habit_comp_track')
      .insert({
        user_habit_id: userHabit.id,
        date: today,
        evt_time: '09:00-1',
        completed_at: new Date().toISOString()
      });
    
    if (completeError2) throw completeError2;
    console.log('Marked second sub-event as complete');
    
    // Get completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_comp_track')
      .select('*')
      .eq('user_habit_id', userHabit.id)
      .eq('date', today);
    
    if (completionsError) throw completionsError;
    console.log('Completions:', completions);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
