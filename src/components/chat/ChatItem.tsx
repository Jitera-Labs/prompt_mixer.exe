import { useState } from 'react';
import type { ChatWithPreview } from '../../lib/types';
import { formatRelativeTime } from '../../lib/timestamps';
import { useChatStore } from '../../stores/chatStore';

interface ChatItemProps {
  chat: ChatWithPreview;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const updateChatTitle = useChatStore(s => s.updateChatTitle);

  const handleTitleSubmit = async () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      await updateChatTitle(chat.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group px-2 py-1 mb-1 cursor-pointer transition-none ${
        isActive ? 'nc-highlight' : 'hover:bg-[var(--nc-cyan)] hover:text-black'
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            className="w-full bg-transparent border border-white text-sm text-[var(--nc-bright-white)] outline-none focus:border-[var(--nc-cyan)] px-1 py-0.5"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="flex justify-between">
            <span
              className="truncate font-bold text-[var(--nc-bright-white)] group-hover:text-black"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditTitle(chat.title); }}
            >
              {chat.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 text-[var(--nc-black)] font-bold ml-2 transition-none"
            >
              [X]
            </button>
          </div>
        )}
        <div className="flex justify-between text-sm mt-0.5">
          <span className="text-[var(--nc-white)] group-hover:text-black text-xs truncate">
            {chat.last_message}
          </span>
          <span className="text-[var(--nc-white)] group-hover:text-black text-xs ml-2">
            {formatRelativeTime(chat.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
