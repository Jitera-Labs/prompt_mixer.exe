import { useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';

function InlineError() {
  const { error, messages, clearError, setInputValue, activeChatId, addMessage, isStreaming, setIsStreaming, clearStreaming, setPendingRegenerate } = useChatStore();

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  const handleRetry = useCallback(() => {
    if (!lastUserMessage || !activeChatId) return;
    clearError();
    // Remove the last assistant message if it exists after the user message, then regenerate
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      // Use regenerateMessage to delete and re-stream
      useChatStore.getState().regenerateMessage(lastMsg.id);
    } else {
      // No assistant message yet — just re-trigger streaming
      setPendingRegenerate(true);
    }
  }, [lastUserMessage, activeChatId, messages, clearError, setPendingRegenerate]);

  const handleResume = useCallback(() => {
    if (!activeChatId) return;
    clearError();
    // Resume = re-trigger streaming from current state
    setPendingRegenerate(true);
  }, [activeChatId, clearError, setPendingRegenerate]);

  const handleEdit = useCallback(() => {
    if (!lastUserMessage) return;
    clearError();
    setInputValue(lastUserMessage.content);
  }, [lastUserMessage, clearError, setInputValue]);

  if (!error || error.chatId !== activeChatId) return null;

  const isInterrupted = error.type === 'interrupted';

  return (
    <div className={`nc-panel p-4 flex flex-col gap-3 ${
      isInterrupted
        ? 'border-[var(--nc-yellow)]'
        : 'border-red-500'
    }`} style={{ boxShadow: 'none' }}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold uppercase ${
          isInterrupted ? 'text-[var(--nc-yellow)]' : 'text-red-500'
        }`}>
          {error.message}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isInterrupted ? (
          <button
            onClick={handleResume}
            className="bg-transparent border-none text-[var(--nc-yellow)] hover:bg-[var(--nc-yellow)] hover:text-black px-1 cursor-pointer"
          >
            [RESUME]
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="bg-transparent border-none text-red-500 hover:bg-red-500 hover:text-black px-1 cursor-pointer"
          >
            [RETRY]
          </button>
        )}
        {lastUserMessage && (
          <button
            onClick={handleEdit}
            className="bg-transparent border-none text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black px-1 cursor-pointer"
          >
            [EDIT]
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatArea() {
  const { activeChatId, messages, streamingContent, isStreaming, error } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent, error]);

  return (
    <div className="nc-panel h-full relative flex flex-col overflow-visible pt-4 px-0 pb-0">
      <div className="nc-header">TERMINAL</div>

      <div className="flex-grow flex flex-col overflow-hidden relative" style={{ padding: '16px', paddingBottom: '0', paddingTop: '12px' }}>
        <div
          ref={scrollContainerRef}
          className="flex-grow nc-scroll overflow-y-auto p-2 text-xl leading-relaxed flex flex-col gap-4"
        >
          {!activeChatId ? (
          <EmptyState />
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && streamingContent && (
              <>
                <MessageBubble
                  message={{
                    id: -1,
                    chat_id: activeChatId,
                    role: 'assistant',
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                />
                <div className="flex items-center gap-2 text-[var(--nc-yellow)]">
                  <span>C:\&gt;</span>
                  <span className="bg-[var(--nc-yellow)] w-3 h-5 animate-pulse"></span>
                </div>
              </>
            )}
            <InlineError />
          </>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="shrink-0 border-t-2 border-[var(--nc-white)] bg-black">
        <ChatInput />
      </div>
    </div>
  );
}
