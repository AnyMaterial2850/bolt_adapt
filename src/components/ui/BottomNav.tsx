import { Logo } from './Logo';
import { useChatStore } from '../../stores/chatStore';
import { ChatOverlay } from '../chat/ChatOverlay';

export function BottomNav() {
  const { isOpen, toggle } = useChatStore();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-center h-16">
          <button
            onClick={toggle}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Open chat"
          >
            <Logo className="w-8 h-8 text-primary-500" />
          </button>
        </div>
      </nav>

      {/* Chat Overlay */}
      {isOpen && <ChatOverlay />}
    </>
  );
}