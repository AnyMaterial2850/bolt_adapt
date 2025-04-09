import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://tukucvihlyqdxehzeodv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1a3VjdmlobHlxZHhlaHplb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjgxMTUsImV4cCI6MjA1NTA0NDExNX0.SZ4hLFWNfCdwt3QVJwh0uvVUbjdp1q9BC0-XkrXlwJ4';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateProteinHabit() {
  try {
    console.log('Fetching Protein habit by ID...');
    
    const { data: habits, error: fetchError } = await supabase
      .from('habits')
      .select('id, title, bottom_line_items')
      .eq('id', '7b1b27bf-8783-4dfa-88d4-21f793153945');
    
    if (fetchError) throw fetchError;
    if (!habits || habits.length === 0) throw new Error('Protein habit not found');
    if (habits.length > 1) throw new Error('Multiple habits found with same ID');
    
    const habit = habits[0];
    console.log('Found Protein habit:', habit.title);
    
    const items = habit.bottom_line_items || [];
    const itemIndex = items.findIndex(i => i.title === 'Why Protein is important');
    if (itemIndex === -1) throw new Error('"Why Protein is important" item not found');
    
    console.log('Current type:', items[itemIndex].type);
    items[itemIndex].type = 'video';
    
    const { error: updateError } = await supabase
      .from('habits')
      .update({ bottom_line_items: items })
      .eq('id', habit.id);
    
    if (updateError) throw updateError;
    
    console.log('Successfully updated bottom line item type to video.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateProteinHabit();
