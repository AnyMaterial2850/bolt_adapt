/**
 * This script tests habit reminders in plan view
 * Run this script with: node test-plan-habit-reminders.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Supabase setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHabitReminders() {
  console.log('\n🔍 Checking habit reminders...\n');

  try {
    // Get all user habits
    const { data: userHabits, error } = await supabase
      .from('user_habits')
      .select('*, habit:habits(*)');

    if (error) throw error;
    
    console.log(`📊 Found ${userHabits.length} user habits in total`);
    
    let habitsWithReminders = 0;
    let reminderCount = 0;
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Process each user habit
    for (const habit of userHabits) {
      let habitHasReminders = false;
      
      console.log(`\n🔷 Habit: ${habit.habit?.title || 'Unknown'} (ID: ${habit.id})`);
      console.log(`  ├─ Active: ${habit.active ? 'Yes' : 'No'}`);
      
      if (!habit.daily_schedules || !Array.isArray(habit.daily_schedules)) {
        console.log(`  ├─ ⚠️ No daily schedules or invalid format`);
        continue;
      }
      
      // Check daily schedules
      console.log(`  ├─ Daily Schedules:`);
      
      for (const daySchedule of habit.daily_schedules) {
        // Skip inactive days
        if (!daySchedule.active) {
          console.log(`  │  ├─ ${daySchedule.day}: Inactive (skipped)`);
          continue;
        }
        
        console.log(`  │  ├─ ${daySchedule.day}: Active`);
        
        // Check if schedules exist and are in array format
        if (!daySchedule.schedules || !Array.isArray(daySchedule.schedules)) {
          console.log(`  │  │  ├─ ⚠️ No schedules or invalid format`);
          continue;
        }
        
        // Process each event schedule
        for (const [index, schedule] of daySchedule.schedules.entries()) {
          console.log(`  │  │  ├─ Event ${index + 1}:`);
          console.log(`  │  │  │  ├─ Time: ${schedule.event_time || 'Not set'}`);
          
          // Debug info about the reminder_time field
          console.log(`  │  │  │  ├─ Reminder Debug: type=${typeof schedule.reminder_time}, value="${schedule.reminder_time}", JSON=${JSON.stringify(schedule.reminder_time)}`);
          
          if (schedule.reminder_time) {
            console.log(`  │  │  │  └─ Reminder: ${schedule.reminder_time} ✅`);
            habitHasReminders = true;
            reminderCount++;
          } else {
            console.log(`  │  │  │  └─ Reminder: Not set ❌`);
          }
        }
      }
      
      if (habitHasReminders) {
        habitsWithReminders++;
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total user habits: ${userHabits.length}`);
    console.log(`Habits with reminders: ${habitsWithReminders}`);
    console.log(`Total reminders found: ${reminderCount}`);
    
    if (habitsWithReminders === 0) {
      console.log('\n❌ ISSUE FOUND: No habits have reminders set in the database!');
      console.log('This explains why reminders are not showing in the plan view.');
    } else {
      console.log('\n⚠️ Some habits have reminders, but they may not be showing in the plan view.');
      console.log('Check the frontend components for rendering issues.');
    }
    
  } catch (error) {
    console.error('Error checking habit reminders:', error);
  }
}

// Run the check
checkHabitReminders();
