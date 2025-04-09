import { Logo } from './Logo';
import { useChatStore } from '../../stores/chatStore';
import { ChatOverlay } from '../chat/ChatOverlay';

export function BottomNav() {
  const { isOpen, toggle } = useChatStore();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 pb-safe-bottom">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center justify-center w-full">
              {/* Chat Button with Adapt Logo */}
              <button
                onClick={toggle}
                className="flex flex-col items-center justify-center p-2 rounded-lg text-primary-500 hover:text-primary-600 transition-colors"
                aria-label="Chat"
              >
                <Logo className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Chat</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Overlay */}
      {isOpen && <ChatOverlay />}
    </>
  );
}
