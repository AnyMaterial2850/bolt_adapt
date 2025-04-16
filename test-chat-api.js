// Simple test script for the chat API integration
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'https://alpha.api.intellaigent.starti.no/experts/call';
const EXPERT_ID = '8eff22ed-67ec-43f6-9050-662ae79f585b';

// Sample user message
const userMessage = {
  id: uuidv4(),
  name: "User",
  type: "human",
  content: "Hi Sonia, can you give me a habit coaching tip?",
  created_at: new Date().toISOString()
};

// Sample user context
const userContext = {
  profile: {
    first_name: "Test",
    target_weight: 70,
    preferred_weight_unit: "kg"
  },
  goals: {
    what: "Improve fitness",
    why: "To feel better and have more energy",
    timeline: "3 months"
  },
  habits: [
    {
      id: "habit1",
      title: "Daily walk",
      category: "move",
      active: true,
      completions: [
        { date: "2025-04-11", completed: true },
        { date: "2025-04-10", completed: true },
        { date: "2025-04-09", completed: false }
      ]
    }
  ]
};

// Prepare the request payload
const payload = {
  message_id: uuidv4(),
  messages: [userMessage],
  expert: {
    id: EXPERT_ID,
    name: "Sonia",
    description: "Your habit coach",
    instructions_responder: "Be warm and encouraging",
    instructions_personator: "Sonia is an expert in habit coaching",
    temperature: 0.5,
    documents: [
      { title: 'User Profile', content: JSON.stringify(userContext.profile) },
      { title: 'User Goals', content: JSON.stringify(userContext.goals) },
      { title: 'User Habits', content: JSON.stringify(userContext.habits) }
    ],
    llm: {
      model: "anthropic/claude-3.7-sonnet",
      temperature: 0.3
    },
    openapi_tools: []
  },
  timezone_offset: new Date().getTimezoneOffset() / -60 // Convert to hours and invert
};

console.log("Testing chat API integration...");
console.log("Sending message:", userMessage.content);
console.log("Waiting for response...");

// Connect to the API using fetchEventSource
fetchEventSource(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload),
  onopen(res) {
    if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
      console.log('Connection opened successfully');
    } else {
      console.error(`Failed to open connection: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to open connection: ${res.status} ${res.statusText}`);
    }
  },
  onmessage(msg) {
    const event = msg.event;
    const data = JSON.parse(msg.data);

    switch (event) {
      case 'on_critiques':
        console.log('\n[CRITIQUE]', data.content);
        break;
      case 'on_reasoning':
        console.log('\n[REASONING]', data.content);
        break;
      case 'on_persona':
        console.log('\n[PERSONA]', data.content);
        break;
      case 'on_response_stream':
        process.stdout.write('.');  // Show progress without flooding console
        break;
      case 'on_response_end':
        console.log('\n\n[FINAL RESPONSE]');
        console.log(data.content);
        console.log('\nTest completed successfully!');
        break;
      default:
        console.log('\n[UNHANDLED EVENT]', event, data);
    }
  },
  onerror(err) {
    console.error('Error:', err);
  }
})
.catch(err => {
  console.error('Failed to connect:', err);
});
