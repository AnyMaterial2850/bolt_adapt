import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useDebugStore } from '../../stores/debugStore';
import { useChatStore } from '../../stores/chatStore';
import { Logo } from '../ui/Logo';

interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  created_at: string;
}

export function ChatOverlay() {
  const { close } = useChatStore();
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);


  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      addLog('Loading chat messages...', 'info', { 
        component: 'ChatOverlay',
        data: { userId: user?.id }
      });

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      addLog(`Loaded ${data?.length || 0} messages`, 'success', {
        component: 'ChatOverlay',
        data: { messageCount: data?.length }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      addLog('Failed to load messages', 'error', {
        component: 'ChatOverlay',
        error
      });
    } finally {
      setIsLoading(false);
    }
  }, [addLog, setIsLoading, setMessages, user?.id]);

  useEffect(() => {
    if (user) {
      loadMessages();
    }

    const handleFocus = () => {
      setIsKeyboardVisible(true);
      addLog('Keyboard became visible', 'debug', { component: 'ChatOverlay' });
      setTimeout(scrollToBottom, 100);
    };

    const handleBlur = () => {
      setIsKeyboardVisible(false);
      addLog('Keyboard hidden', 'debug', { component: 'ChatOverlay' });
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    }

    addLog('Chat overlay mounted', 'debug', { 
      component: 'ChatOverlay',
      data: { userId: user?.id }
    });

    return () => {
      if (input) {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      }
      addLog('Chat overlay unmounted', 'debug', { component: 'ChatOverlay' });
    };
  }, [user, addLog, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      addLog('Closing chat via overlay click', 'debug', { component: 'ChatOverlay' });
      close();
    }
  };

  const handleCloseClick = () => {
    addLog('Closing chat via X button', 'debug', { component: 'ChatOverlay' });
    close();
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      addLog('Sending message...', 'info', {
        component: 'ChatOverlay',
        data: { messageLength: newMessage.length }
      });
      setIsTyping(true);

      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: user.id,
            content: newMessage.trim(),
            is_ai: false
          }
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      scrollToBottom();

      setTimeout(async () => {
        const { data: aiData, error: aiError } = await supabase
          .from('chat_messages')
          .insert([
            {
              user_id: user.id,
              content: "I'm your ADAPT AI coach. How can I help you today?",
              is_ai: true
            }
          ])
          .select()
          .single();

        if (aiError) throw aiError;

        setMessages(prev => [...prev, aiData]);
        setIsTyping(false);
      }, 1000);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      addLog('Failed to send message', 'error', {
        component: 'ChatOverlay',
        error
      });
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  return (
    <div 
      ref={overlayRef}
      className={cn(
        "fixed inset-0 bg-black/50 z-50",
        isKeyboardVisible && "h-screen"
      )} 
      onClick={handleOverlayClick}
    >
      <div 
        className={cn(
          "fixed inset-0 max-w-lg mx-auto bg-white shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300",
          isKeyboardVisible && "h-screen"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Logo className="w-8 h-8 text-primary-500" />
            <h2 className="text-lg font-semibold">Your ADAPT AI Coach</h2>
          </div>
          <button
            onClick={handleCloseClick}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start a conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.is_ai ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.is_ai
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-900"
                    )}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-primary-500 text-white rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isTyping}
              className={cn(
                "p-2 rounded-full transition-colors",
                newMessage.trim() && !isTyping
                  ? "bg-primary-500 text-white hover:bg-primary-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}