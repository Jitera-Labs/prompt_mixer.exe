import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-100"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="nc-panel w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        style={{ padding: 0 }} // Override nc-panel padding if it has any, to control layout
      >
        {title && (
          <div className="bg-[var(--nc-blue)] border-b border-[var(--nc-border)] px-4 py-3 flex justify-between items-center shrink-0">
            <h2 id="modal-title" className="text-[var(--nc-yellow)] font-bold uppercase tracking-wider text-lg">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--nc-panel-text)] hover:text-[var(--nc-yellow)] hover:bg-[var(--nc-blue)] font-bold px-2 focus:outline-none uppercase"
              aria-label="Close"
            >
              [CLOSE]
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
            {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
