// Chat list sidebar
// - "New Chat" button at top (Plus icon)
// - List of ChatWithPreview items
// - Load chats on mount
// - Each item shows: title, last message preview (truncated), relative timestamp
// - Active chat highlighted
// - Click to select, × to delete
// - Scrollable list
import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ChatItem } from './ChatItem';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { chats, activeChatId, loadChats, createChat, selectChat, deleteChat } = useChatStore();
  const enableVisualEffects = useSettingsStore(s => s.enableVisualEffects);

  useEffect(() => { loadChats(); }, []);

  const handleNewChat = async () => {
    // Don't create yet - user will type first message
    // Instead, deselect current chat to show empty state
    useChatStore.setState({ activeChatId: null, messages: [] });
  };

  if (collapsed) {
    return (
      <div className="nc-panel h-full flex flex-col items-center py-2 relative min-w-0">
        <button
          onClick={onToggle}
          className="text-[var(--nc-yellow)] hover:text-[var(--nc-bright-white)] mb-4"
          title="Expand History"
        >
          [►]
        </button>
        <button
          onClick={handleNewChat}
          className="text-[var(--nc-cyan)] hover:text-[var(--nc-bright-white)] text-xl font-bold mb-4"
          title="New Chat"
        >
          +
        </button>
        <div style={{ writingMode: 'vertical-rl' }} className="text-[var(--nc-gray)] tracking-widest text-xs select-none">
          HISTORY
        </div>
      </div>
    );
  }

  return (
    <div className="nc-panel h-full flex flex-col overflow-visible relative" style={{ padding: 0 }}>
      <div className="nc-header" style={{ marginTop: '-14px' }}>HISTORY</div>
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute top-1 right-2 text-[var(--nc-yellow)] hover:text-[var(--nc-bright-white)] text-xs z-10 bg-[var(--nc-panel-bg)] px-1"
          title="Collapse History"
        >
          [◄]
        </button>
      )}
      <div className="flex flex-col gap-2 mt-4 px-2">
        <button
          onClick={handleNewChat}
          className="nc-button w-full text-left flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          NEW_CHAT.BAT
        </button>
      </div>
      <div className="flex-grow nc-scroll overflow-y-auto px-1">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-[var(--nc-gray)] text-sm">NO CHATS YET</div>
        ) : (
          chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={() => selectChat(chat.id)}
              onDelete={() => deleteChat(chat.id)}
            />
          ))
        )}
      </div>
      <div className="px-2 py-1 border-t-2 border-white text-center text-[var(--nc-yellow)] text-sm">
        {chats.length} FILES FOUND
      </div>
    </div>
  );
}
