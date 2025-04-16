// Test script for PlanHabitItem component
// This script tests the handling of different eventTime formats in PlanHabitItem

// Import necessary modules
import { format, parse } from 'date-fns';

// Mock the eventTime handling logic from PlanHabitItem
function formatEventTime(eventTime) {
  try {
    if (eventTime.includes('-')) {
      return `Event ${parseInt(eventTime.split('-')[1]) + 1}`;
    } else {
      return format(parse(eventTime, 'HH:mm', new Date()), 'h:mm a');
    }
  } catch (error) {
    console.error(`Error formatting event time: ${eventTime}`, error);
    return 'Invalid time';
  }
}

// Test cases
const testCases = [
  { eventTime: '09:00', expected: '9:00 AM' },
  { eventTime: '14:30', expected: '2:30 PM' },
  { eventTime: '09:00-0', expected: 'Event 1' },
  { eventTime: '09:00-1', expected: 'Event 2' },
  { eventTime: '09:00-2', expected: 'Event 3' },
  { eventTime: 'invalid', expected: 'Invalid time' }
];

// Run tests
console.log('Testing PlanHabitItem eventTime formatting:');
console.log('==========================================');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = formatEventTime(testCase.eventTime);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.eventTime} -> ${result}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
    console.log('------------------------------------------');
    
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  } catch (error) {
    console.error(`Test ${index + 1} threw an error:`, error);
    failedTests++;
  }
});

console.log(`Test summary: ${passedTests} passed, ${failedTests} failed`);
