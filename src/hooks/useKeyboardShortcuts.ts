import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { cancelSession } from '../lib/tauri';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + N: New chat
      if (isMod && e.key === 'n') {
        e.preventDefault();
        useChatStore.setState({ activeChatId: null, messages: [] });
      }

      // Ctrl/Cmd + K: Focus chat input
      if (isMod && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
        input?.focus();
      }

      // Ctrl/Cmd + ,: Open settings
      if (isMod && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }

      // Escape: Cancel generation
      if (e.key === 'Escape') {
        const { isStreaming } = useChatStore.getState();
        if (isStreaming) {
          cancelSession();
        }
      }

      // Up Arrow (when input is empty): Edit last user message
      if (e.key === 'ArrowUp' && !isMod) {
        const input = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
        if (input && document.activeElement === input && input.value === '') {
          e.preventDefault();
          const { messages } = useChatStore.getState();
          const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
          if (lastUserMsg) {
            // Set input value to last user message for editing
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            nativeInputValueSetter?.call(input, lastUserMsg.content);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}
