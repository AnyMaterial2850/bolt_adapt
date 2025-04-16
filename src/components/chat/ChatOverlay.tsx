import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Info, Brain, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useDebugStore } from '../../stores/debugStore';
import { useChatStore } from '../../stores/chatStore';
import { Logo } from '../ui/Logo';
import { ChatMessage } from '../../types/database';

export function ChatOverlay() {
  const { 
    close, 
    messages, 
    isLoading, 
    isStreaming, 
    streamingContent, 
    error,
    persona,
    reasoning,
    critique,
    sendMessage,
    setError
  } = useChatStore();
  
  const { user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [newMessage, setNewMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showPersona, setShowPersona] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showCritique, setShowCritique] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Handle keyboard visibility for mobile
  useEffect(() => {
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
  }, [user, addLog]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isLoading || isStreaming) return;

    addLog('Sending message via form submit', 'info', {
      component: 'ChatOverlay',
      data: { messageLength: newMessage.length }
    });
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      await sendMessage(messageContent);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      addLog('Exception in handleSendMessage', 'error', {
        component: 'ChatOverlay',
        error
      });
      setError(`Failed to send message: ${error.message}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // Helper to render message metadata buttons
  const renderMetadataButtons = (message: ChatMessage) => {
    if (message.type !== 'ai') return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {persona && (
          <button 
            onClick={() => setShowPersona(!showPersona)}
            className="text-xs text-primary-400 hover:text-primary-500 flex items-center"
            aria-label="How Sonia coaches"
          >
            <Info className="w-3 h-3 mr-1" />
            How Sonia coaches
          </button>
        )}
        {reasoning && (
          <button 
            onClick={() => setShowReasoning(!showReasoning)}
            className="text-xs text-primary-400 hover:text-primary-500 flex items-center"
            aria-label="Why Sonia said this"
          >
            <Brain className="w-3 h-3 mr-1" />
            Why Sonia said this
          </button>
        )}
        {critique && (
          <button 
            onClick={() => setShowCritique(!showCritique)}
            className="text-xs text-primary-400 hover:text-primary-500 flex items-center"
            aria-label="Reflection from past chats"
          >
            <History className="w-3 h-3 mr-1" />
            Reflection from past chats
          </button>
        )}
      </div>
    );
  };

  // Helper to render metadata panels
  const renderMetadataPanels = () => {
    return (
      <>
        {showPersona && persona && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg text-sm border border-primary-100">
            <h3 className="font-medium text-primary-700 flex items-center mb-1">
              <Info className="w-4 h-4 mr-1" />
              How Sonia Coaches
            </h3>
            <p className="text-gray-700">{persona.content}</p>
          </div>
        )}
        {showReasoning && reasoning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm border border-blue-100">
            <h3 className="font-medium text-blue-700 flex items-center mb-1">
              <Brain className="w-4 h-4 mr-1" />
              Why Sonia Said This
            </h3>
            <p className="text-gray-700">{reasoning.content}</p>
          </div>
        )}
        {showCritique && critique && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm border border-amber-100">
            <h3 className="font-medium text-amber-700 flex items-center mb-1">
              <History className="w-4 h-4 mr-1" />
              Reflection From Past Chats
            </h3>
            <p className="text-gray-700">{critique.content}</p>
          </div>
        )}
      </>
    );
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
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start a conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error message if any */}
              {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                  <button 
                    onClick={() => setError(null)} 
                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {/* Render all messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.type === 'ai' ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.type === 'ai'
                        ? "bg-primary-500 text-white"
                        : "bg-gray-200 text-gray-900"
                    )}
                  >
                    <p>{message.content}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                      {message.type === 'ai' && (
                        <span className="text-xs opacity-70 ml-2">
                          {message.name}
                        </span>
                      )}
                    </div>
                    {renderMetadataButtons(message)}
                  </div>
                </div>
              ))}
              
              {/* Render metadata panels */}
              {renderMetadataPanels()}
              
              {/* Streaming/typing indicator */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-primary-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                    {streamingContent ? (
                      <div>
                        <p>{streamingContent}</p>
                        <div className="flex space-x-2 mt-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">Sonia is thinking</span>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading || isStreaming}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading || isStreaming}
              className={cn(
                "p-2 rounded-full transition-colors",
                newMessage.trim() && !isLoading && !isStreaming
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
