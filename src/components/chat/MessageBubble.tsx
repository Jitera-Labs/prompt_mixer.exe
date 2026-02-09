import { useState } from 'react';
import { Streamdown, type StreamdownProps } from 'streamdown';
import type { Message } from '../../lib/types';
import { useChatStore } from '../../stores/chatStore';
import { formatRelativeTime } from '../../lib/timestamps';

const markdownComponents: StreamdownProps['components'] = {
  h1: ({ children }) => <h1>{children}</h1>,
  h2: ({ children }) => <h2>{children}</h2>,
  h3: ({ children }) => <h3>{children}</h3>,
  h4: ({ children }) => <h4>{children}</h4>,
  p: ({ children }) => <p>{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return <code>{children}</code>;
  },
  pre: ({ children }) => <pre>{children}</pre>,
  table: ({ children }) => (
    <div>
      <table>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  hr: () => <hr />,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
};

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { editMessage, setPendingRegenerate, regenerateMessage } = useChatStore();

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message.id, editContent.trim());
      setPendingRegenerate(true);
    }
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    await regenerateMessage(message.id);
  };

  return (
    <div className={isUser ? 'nc-message nc-message--user border-2 border-[var(--nc-white)]' : 'nc-message nc-message--assistant border-2 border-[var(--nc-white)]'}>
      <div className="nc-label bg-[var(--nc-bg)] inline-block px-1 -mt-3 ml-2 border border-[var(--nc-white)]">
        {isUser ? '[USER]' : '[SYSTEM]'}
      </div>
      <div className="p-2">
      {isUser ? (
        isEditing ? (
          <div className="nc-form">
            <textarea
              className="nc-textarea"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
              autoFocus
            />
            <div>
              <button onClick={handleEdit} className="nc-button nc-button-primary">[SAVE]</button>{' '}
              <button onClick={() => setIsEditing(false)} className="nc-button">[CANCEL]</button>
            </div>
          </div>
        ) : (
          <>
            <div className="nc-prose">
              <Streamdown isAnimating={isStreaming} caret="block" components={markdownComponents}>
                {message.content}
              </Streamdown>
            </div>
            {!isStreaming && message.id !== -1 && (
              <div className="nc-status-line flex justify-between items-center mt-2 pt-2 border-t border-[var(--nc-white)] border-dotted">
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-sm px-1 bg-transparent border-none text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black transition-none cursor-pointer" title="Copy">
                    {copied ? '[COPIED]' : '[COPY]'}
                  </button>
                  <button onClick={() => { setIsEditing(true); setEditContent(message.content); }} className="text-sm px-1 bg-transparent border-none text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black transition-none cursor-pointer" title="Edit">
                    [EDIT]
                  </button>
                </div>
                <span className="text-sm text-[var(--nc-gray)]">{formatRelativeTime(message.created_at)}</span>
              </div>
            )}
          </>
        )
      ) : (
        isEditing ? (
          <div className="nc-prose">SYSTEM MESSAGES CANNOT BE EDITED</div>
        ) : (
          <>
            <div className="nc-prose">
              <Streamdown isAnimating={isStreaming} caret="block" components={markdownComponents}>
                {message.content}
              </Streamdown>
            </div>
            {!isStreaming && message.id !== -1 && (
              <div className="nc-status-line flex justify-between items-center mt-2 pt-2 border-t border-[var(--nc-white)] border-dotted">
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-sm px-1 bg-transparent border-none text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black transition-none cursor-pointer" title="Copy">
                    {copied ? '[COPIED]' : '[COPY]'}
                  </button>
                  <button onClick={handleRegenerate} className="text-sm px-1 bg-transparent border-none text-[var(--nc-white)] hover:bg-[var(--nc-white)] hover:text-black transition-none cursor-pointer" title="Regenerate">
                    [REGEN]
                  </button>
                </div>
                <span className="text-sm text-[var(--nc-gray)]">{formatRelativeTime(message.created_at)}</span>
              </div>
            )}
          </>
        )
      )}
      </div>
    </div>
  );
}
