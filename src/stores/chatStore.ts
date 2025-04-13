import { create } from 'zustand';
import { useDebugStore } from './debugStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import {
  ChatMessage,
  ChatPersona,
  ChatReasoning,
  ChatCritique,
} from '../types/database';
import { sendMessageToExpert, getUserContext } from '../services/chatService';

// Simple UUID generation function to replace the uuid package
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ChatState {
  // UI state
  isOpen: boolean;
  isLoading: boolean; // Loading initial messages or sending a message
  isStreaming: boolean; // AI response is streaming
  streamingContent: string; // Partial content during streaming
  error: string | null; // To display errors in the UI

  // Data
  messages: ChatMessage[];
  persona: ChatPersona | null;
  reasoning: ChatReasoning | null;
  critique: ChatCritique | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  clearStreamingState: () => void;
  setError: (errorMessage: string | null) => void;

  // Internal state updaters (optional, could be handled within actions)
  // setMessages: (messages: ChatMessage[]) => void;
  // appendMessage: (message: ChatMessage) => void;
  // updateStreamingContent: (content: string) => void;
  // setPersona: (persona: ChatPersona) => void;
  // setReasoning: (reasoning: ChatReasoning) => void;
  // setCritique: (critique: ChatCritique) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  const { addLog } = useDebugStore.getState();

  const loadMessages = async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      addLog('Cannot load messages, no user logged in', 'warn', { component: 'ChatStore' });
      set({ messages: [], isLoading: false });
      return;
    }

    addLog('Loading chat messages from DB', 'info', { component: 'ChatStore' });
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map data to ensure correct types (especially if is_ai still exists)
      const mappedMessages: ChatMessage[] = (data || []).map(dbMsg => ({
        id: dbMsg.id,
        user_id: dbMsg.user_id,
        name: dbMsg.name,
        type: dbMsg.type,
        content: dbMsg.content,
        created_at: dbMsg.created_at,
      }));

      set({ messages: mappedMessages, isLoading: false });
      addLog(`Loaded ${mappedMessages.length} messages`, 'success', { component: 'ChatStore' });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      addLog('Failed to load messages', 'error', { component: 'ChatStore', error });
      set({ isLoading: false, error: 'Failed to load chat history.' });
    }
  };

  const sendMessage = async (content: string) => {
    const { user } = useAuthStore.getState();
    if (!user || !content.trim()) return;

    addLog('Sending message action initiated', 'info', { component: 'ChatStore' });
    set({ isLoading: true, isStreaming: true, error: null, streamingContent: '', persona: null, reasoning: null, critique: null });

    // 1. Create and Optimistically Add User Message
    const userMessage: ChatMessage = {
      id: generateUUID(), // Temporary ID, replace if needed after DB insert
      user_id: user.id,
      name: 'User',
      type: 'human',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, userMessage] }));

    // 2. Save User Message to DB (could be done in parallel with API call)
    try {
      const { error: dbError } = await supabase
        .from('chat_messages')
        .insert([
          {
            id: userMessage.id, // Use the generated ID
            user_id: userMessage.user_id,
            name: userMessage.name,
            type: userMessage.type,
            content: userMessage.content,
            created_at: userMessage.created_at,
          },
        ]);
      if (dbError) {
        // Handle DB save error - maybe mark the message as unsent?
        addLog('Failed to save user message to DB', 'error', { component: 'ChatStore', error: dbError });
        // Optionally revert optimistic update or show error state
      } else {
         addLog('User message saved to DB', 'debug', { component: 'ChatStore' });
      }
    } catch(err) {
       const error = err instanceof Error ? err : new Error('DB error saving user message');
       addLog('Exception saving user message to DB', 'error', { component: 'ChatStore', error });
    }


    // 3. Prepare for API Call
    const currentMessages = get().messages; // Get the latest message list including the optimistic one
    try {
      const userContext = await getUserContext(user.id);

      // 4. Call the API Service
      await sendMessageToExpert(currentMessages, user.id, userContext, {
        onStreamUpdate: (streamedContent) => {
          set({ streamingContent: streamedContent, isLoading: false, isStreaming: true }); // Keep streaming true
        },
        onPersona: (personaContent) => {
          set({ persona: { content: personaContent, timestamp: new Date().toISOString() } });
        },
        onReasoning: (reasoningContent) => {
          set({ reasoning: { content: reasoningContent, timestamp: new Date().toISOString() } });
        },
        onCritique: (critiqueContent) => {
          set({ critique: { content: critiqueContent, timestamp: new Date().toISOString() } });
        },
        onComplete: async (aiMessage) => {
          addLog('AI response received', 'success', { component: 'ChatStore' });
          // Save AI message to DB
          try {
             const { error: aiDbError } = await supabase
              .from('chat_messages')
              .insert([
                {
                  id: aiMessage.id,
                  user_id: aiMessage.user_id,
                  name: aiMessage.name,
                  type: aiMessage.type,
                  content: aiMessage.content,
                  created_at: aiMessage.created_at,
                }
              ]);
             if (aiDbError) {
               addLog('Failed to save AI message to DB', 'error', { component: 'ChatStore', error: aiDbError });
               // Show error, but message is already received
             } else {
               addLog('AI message saved to DB', 'debug', { component: 'ChatStore' });
             }
          } catch(err) {
            const error = err instanceof Error ? err : new Error('DB error saving AI message');
            addLog('Exception saving AI message to DB', 'error', { component: 'ChatStore', error });
          }

          // Add AI message to state and clear streaming state
          set((state) => ({
            messages: [...state.messages, aiMessage],
            isLoading: false,
            isStreaming: false,
            streamingContent: '',
            // Keep metadata (persona, reasoning, critique) until next message
          }));
        },
        onError: (error) => {
          addLog('Chat API error received', 'error', { component: 'ChatStore', error });
          set({ isLoading: false, isStreaming: false, error: `AI Coach Error: ${error.message}` });
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message or get context');
      addLog('Error in sendMessage process', 'error', { component: 'ChatStore', error });
      set({ isLoading: false, isStreaming: false, error: 'Failed to send message.' });
    }
  };

  return {
    isOpen: false,
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    messages: [],
    persona: null,
    reasoning: null,
    critique: null,

    open: () => {
      addLog('Opening chat', 'debug', { component: 'ChatStore' });
      set({ isOpen: true });
      // Load messages when chat is opened
      loadMessages();
    },
    close: () => {
      addLog('Closing chat', 'debug', { component: 'ChatStore' });
      set({ isOpen: false });
      // Optionally clear messages or state on close?
      // set({ messages: [], persona: null, reasoning: null, critique: null, error: null });
    },
    toggle: () => {
      addLog('Toggling chat', 'debug', { component: 'ChatStore' });
      const currentlyOpen = get().isOpen;
      set({ isOpen: !currentlyOpen });
      if (!currentlyOpen) {
        loadMessages(); // Load messages if opening
      }
    },
    loadMessages,
    sendMessage,
    clearStreamingState: () => set({ isStreaming: false, streamingContent: '' }),
    setError: (errorMessage) => set({ error: errorMessage }),
  };
});
