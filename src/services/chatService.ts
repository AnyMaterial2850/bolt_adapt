import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuthStore } from '../stores/authStore';
import { useHabitStore } from '../stores/habitStore';
import { supabase } from '../lib/supabase';
import {
  ChatMessage,
  UserContext,
  Profile,
  UserHabit,
  HabitCompletion,
} from '../types/database';
import { useDebugStore } from '../stores/debugStore';

const API_URL = 'https://alpha.api.intellaigent.starti.no/experts/call';
const EXPERT_ID = '8eff22ed-67ec-43f6-9050-662ae79f585b';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000; // 60 seconds

// Simple UUID generation function to replace the uuid package
function generateUniqueId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- User Context Gathering ---

async function getRecentHabitCompletions(
  userId: string,
  limit = 10,
): Promise<{ date: string; completed: boolean }[]> {
  const { addLog } = useDebugStore.getState();
  try {
    // This requires joining user_habits and habit_completions
    // Simplified for now - needs a proper query or RPC
    addLog('Fetching recent habit completions (simplified)', 'debug', {
      component: 'chatService',
      data: { userId },
    });
    // Placeholder: Replace with actual Supabase query
    // const { data, error } = await supabase.rpc('get_recent_completions', { user_id_param: userId, limit_param: limit });
    // if (error) throw error;
    // return data;
    return []; // Placeholder
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    addLog('Failed to fetch recent habit completions', 'error', {
      component: 'chatService',
      error,
    });
    return [];
  }
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const { addLog } = useDebugStore.getState();
  addLog('Gathering user context for chat', 'debug', {
    component: 'chatService',
    data: { userId },
  });
  const { user } = useAuthStore.getState();
  const { userHabits } = useHabitStore.getState(); // Assuming userHabits are loaded

  const profile: UserContext['profile'] = {
    first_name: user?.first_name ?? null,
    target_weight: user?.target_weight ?? null,
    preferred_weight_unit: user?.preferred_weight_unit ?? null,
  };

  const goals: UserContext['goals'] = {
    what: user?.goal_what ?? null,
    why: user?.goal_why ?? null,
    timeline: user?.goal_timeline ?? null,
  };

  const recentCompletions = await getRecentHabitCompletions(userId);

  const habits: UserContext['habits'] = (userHabits || [])
    .filter((uh) => uh.active && uh.habit)
    .map((uh) => ({
      id: uh.habit_id,
      title: uh.habit?.title ?? 'Unknown Habit',
      category: uh.habit?.category ?? 'unknown',
      active: uh.active,
      // Find completions for this specific habit (can be optimized)
      completions: recentCompletions, // Simplified: Apply completions to all habits for now
    }));

  return { profile, goals, habits };
}

// --- API Communication ---

interface SendMessageCallbacks {
  onStreamUpdate: (content: string) => void;
  onPersona: (content: string) => void;
  onReasoning: (content: string) => void;
  onCritique: (content: string) => void;
  onComplete: (message: ChatMessage) => void;
  onError: (error: Error) => void;
}

export async function sendMessageToExpert(
  messages: ChatMessage[],
  userId: string,
  userContext: UserContext,
  callbacks: SendMessageCallbacks,
): Promise<void> {
  const { addLog } = useDebugStore.getState();
  const requestMessageId = generateUniqueId();
  addLog('Sending message to expert API', 'info', {
    component: 'chatService',
    data: { requestMessageId, messageCount: messages.length },
  });

  // Include all required fields based on API error response
  const payload = {
    message_id: requestMessageId,
    messages: messages.map((msg) => ({
      id: msg.id || generateUniqueId(),
      name: msg.name || (msg.type === 'ai' ? 'Sonia' : 'User'),
      type: msg.type,
      content: msg.content,
      created_at: msg.created_at || new Date().toISOString()
    })),
    expert: {
      id: EXPERT_ID,
      name: 'Sonia',
      description: 'Your habit coach',
      instructions_responder: 'Be warm and encouraging',
      instructions_personator: 'Sonia is an expert in habit coaching',
      documents: []
    },
    timezone_offset: new Date().getTimezoneOffset() / -60 // Convert minutes to hours and invert sign
  };

  let retryCount = 0;
  let ctrl: AbortController | null = null;

  const connectWithRetry = async () => {
    ctrl = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      timeoutId = setTimeout(() => {
        addLog('Chat API request timed out', 'warn', {
          component: 'chatService',
          data: { requestMessageId },
        });
        ctrl?.abort('timeout'); // Abort the fetch request
        callbacks.onError(new Error('Request timed out after 60 seconds'));
      }, TIMEOUT_MS);

      await fetchEventSource(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://adapt-health.app',
          // Add Authentication headers here when needed
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        async onopen(res) { // Keep async for potential future await needs, but ensure void return if not awaiting
          if (timeoutId) clearTimeout(timeoutId); // Clear timeout on successful open
          if (
            res.ok &&
            res.headers.get('content-type')?.includes('text/event-stream')
          ) {
            addLog('SSE connection opened successfully', 'info', {
              component: 'chatService',
              data: { requestMessageId },
            });
            retryCount = 0; // Reset retries on successful connection
          } else {
            throw new Error(
              `Failed to open SSE connection: ${res.status} ${res.statusText}`,
            );
          }
        },
        onmessage(msg) {
          // Reset timeout on receiving any message
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
             addLog('Chat API request timed out during stream', 'warn', {
               component: 'chatService',
               data: { requestMessageId },
             });
             ctrl?.abort('timeout');
             callbacks.onError(new Error('Request timed out after 60 seconds of inactivity'));
           }, TIMEOUT_MS);

          try {
            const event = msg.event;
            const data = JSON.parse(msg.data);

            switch (event) {
              case 'on_critiques':
                callbacks.onCritique(data.content);
                break;
              case 'on_reasoning':
                callbacks.onReasoning(data.content);
                break;
              case 'on_persona':
                callbacks.onPersona(data.content);
                break;
              case 'on_response_stream':
                callbacks.onStreamUpdate(data.content);
                break;
              case 'on_response_end':
                const finalMessage: ChatMessage = {
                  id: generateUniqueId(), // Generate ID for the AI's message
                  user_id: userId,
                  name: 'Sonia',
                  type: 'ai',
                  content: data.content,
                  created_at: new Date().toISOString(),
                };
                callbacks.onComplete(finalMessage);
                // Connection will close automatically after on_response_end
                break;
              default:
                addLog('Unhandled SSE event received', 'warn', {
                  component: 'chatService',
                  data: { event: msg.event },
                });
            }
          } catch (err) {
             const parseError = err instanceof Error ? err : new Error(String(err));
             addLog('Failed to parse SSE message data', 'error', {
               component: 'chatService',
               error: parseError,
               data: { rawData: msg.data }
             });
             // Decide if we should abort or continue, maybe call onError?
             // callbacks.onError(parseError); // Option: Propagate parse errors
          }
        },
        onclose() {
          addLog('SSE connection closed', 'info', {
            component: 'chatService',
            data: { requestMessageId },
          });
          if (timeoutId) clearTimeout(timeoutId);
          // Ensure completion callback was called if not already
        },
        onerror(err) {
          if (timeoutId) clearTimeout(timeoutId);
          const error = err instanceof Error ? err : new Error(String(err));
          addLog('SSE error occurred', 'error', {
            component: 'chatService',
            error: error,
            data: { requestMessageId },
          });

          // Check if the error was due to abort (e.g., timeout)
          if (err.name === 'AbortError' && ctrl?.signal.reason === 'timeout') {
             // Timeout error already handled by the timeout logic
             return; // Don't retry timeouts automatically here
          }


          if (retryCount < MAX_RETRIES) {
            retryCount++;
            addLog(`Attempting SSE retry ${retryCount}/${MAX_RETRIES}`, 'warn', {
              component: 'chatService',
            });
            // Implement exponential backoff
            setTimeout(connectWithRetry, 1000 * Math.pow(2, retryCount - 1));
          } else {
            addLog(`SSE connection failed after ${MAX_RETRIES} retries`, 'error', {
              component: 'chatService',
            });
            callbacks.onError(
              new Error(
                `Connection failed after ${MAX_RETRIES} retries: ${error.message}`,
              ),
            );
          }
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (timeoutId) clearTimeout(timeoutId);
      addLog('Failed to initiate SSE connection', 'error', {
        component: 'chatService',
        error,
        data: { requestMessageId },
      });
      callbacks.onError(error);
    }
  };

  await connectWithRetry();
}
