// Script to add a protein habit with targets
import { createClient } from '@supabase/supabase-js';

// Get environment variables from the .env file
// These should be available in the environment when running the script
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function addProteinHabit() {
  try {
    console.log('Creating protein target habit...');
    
    // Create the habit with target as a PostgreSQL array
    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        title: 'Protein target',
        description: 'Setting a protein intake goal of 1.2 g per kg of body weight',
        category: 'eat',
        icon: 'mdi:food-steak',
        frequency: 'daily',
        frequency_details: { daily: {} },
        // Use PostgreSQL array syntax
        target: '{80,100,120,140}',
        unit: 'g',
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('Habit created successfully:', habit);
    
    return habit;
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

// Run the function
addProteinHabit()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
