import { create } from 'zustand';
import { useDebugStore } from './debugStore';

interface ChatState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useChatStore = create<ChatState>((set) => {
  const { addLog } = useDebugStore.getState();
  
  return {
    isOpen: false,
    open: () => {
      addLog('Opening chat', 'debug', { component: 'ChatStore' });
      set({ isOpen: true });
    },
    close: () => {
      addLog('Closing chat', 'debug', { component: 'ChatStore' });
      set({ isOpen: false });
    },
    toggle: () => {
      addLog('Toggling chat', 'debug', { component: 'ChatStore' });
      set((state) => ({ isOpen: !state.isOpen }));
    },
  };
});