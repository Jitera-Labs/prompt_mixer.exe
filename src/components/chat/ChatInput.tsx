import { useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMixerStore } from '../../stores/mixerStore';
import * as api from '../../lib/tauri';
import { listen } from '@tauri-apps/api/event';

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeChatId, isStreaming, addMessage, createChat, appendStreamingContent, finalizeStreaming, setIsStreaming, clearStreaming, pendingRegenerate, setPendingRegenerate, setError, clearError, inputValue, setInputValue } = useChatStore();
  const input = inputValue;
  const setInput = setInputValue;
  const config = useSettingsStore(s => s.config);
  const getWeightedAnchors = useMixerStore(s => s.getWeightedAnchors);
  const setStatus = useMixerStore(s => s.setStatus);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const startStreamingSession = async (chatId: number) => {
    setIsStreaming(true);

    // Listen for streaming events
    const unlistenToken = await listen<{ text: string }>('llm:token', (event) => {
      appendStreamingContent(event.payload.text);
    });

    const unlistenComplete = await listen<{ status: string }>('llm:complete', async () => {
      await finalizeStreaming();
      setStatus('Done');
      unlistenToken();
      unlistenComplete();
      unlistenStatus();
      unlistenError();
    });

    const unlistenStatus = await listen<{ status: string }>('llm:status', (event) => {
      setStatus(event.payload.status as any);
    });

    const unlistenError = await listen<{ status: string }>('llm:error', (event) => {
      console.error('LLM Error:', event.payload.status);
      setError({
        message: event.payload.status || 'An error occurred while generating a response.',
        chatId,
        type: 'error',
      });
      clearStreaming();
      unlistenToken();
      unlistenComplete();
      unlistenStatus();
      unlistenError();
    });

    // Start mixing session
    try {
      const anchors = getWeightedAnchors();
      // If no anchors have weight, use neutral
      const effectiveAnchors = anchors.length > 0 ? anchors : [{ label: 'Neutral', prompt: 'You are balanced, calm, and objective. Respond without strong emotional coloring. Be clear, direct, and informative. Maintain a professional, even-tempered tone. Provide thoughtful, measured responses without dramatic flair.', weight: 1.0 }];

      await api.startMixingSession({
        chatId,
        anchors: effectiveAnchors,
        providerUrl: config.providerUrl,
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
      });
    } catch (e) {
      console.error('Failed to start mixing session:', e);
      setError({
        message: e instanceof Error ? e.message : String(e),
        chatId,
        type: 'error',
      });
      unlistenToken();
      unlistenComplete();
      unlistenStatus();
      unlistenError();
      clearStreaming();
    }
  };

  const startStreamingRef = useRef(startStreamingSession);
  startStreamingRef.current = startStreamingSession;

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');
    clearError();

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat(message);
    }

    await addMessage('user', message);
    await startStreamingSession(chatId);
  };

  // Watch for pendingRegenerate flag to auto-start a new streaming session
  useEffect(() => {
    if (pendingRegenerate && activeChatId && !isStreaming) {
      setPendingRegenerate(false);
      startStreamingRef.current(activeChatId);
    }
  }, [pendingRegenerate, activeChatId, isStreaming, setPendingRegenerate]);

  const handleStop = async () => {
    try {
      await api.cancelSession();
      // If there's partial content, finalize it and show interrupted state
      const { streamingContent, activeChatId: currentChatId } = useChatStore.getState();
      if (streamingContent) {
        await finalizeStreaming();
      } else {
        clearStreaming();
      }
      if (currentChatId) {
        setError({
          message: 'Generation interrupted',
          chatId: currentChatId,
          type: 'interrupted',
        });
      }
    } catch (e) {
      console.error('Failed to cancel:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex bg-[var(--nc-black)] p-4 items-center">
      <span className="text-[var(--nc-yellow)] mr-2 shrink-0">INPUT&gt;</span>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ENTER COMMAND..."
        rows={1}
        className="flex-grow bg-transparent border-none outline-none text-[var(--nc-bright-white)] text-xl placeholder-[var(--nc-gray)] focus:ring-0 p-0 resize-none max-h-[150px]"
        disabled={isStreaming}
      />
      {isStreaming ? (
        <button
          onClick={handleStop}
          className="bg-transparent border-none text-red-500 hover:bg-red-500 hover:text-[var(--nc-black)] px-1 transition-none uppercase cursor-pointer"
        >
          [STOP]
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-transparent border-none text-[var(--nc-cyan)] hover:bg-[var(--nc-cyan)] hover:text-[var(--nc-black)] px-1 disabled:opacity-30 disabled:cursor-not-allowed transition-none uppercase cursor-pointer"
        >
          [SEND]
        </button>
      )}
    </div>
  );
}
