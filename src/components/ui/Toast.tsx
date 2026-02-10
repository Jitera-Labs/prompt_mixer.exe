import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  onRetry?: () => void;
}

let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null;

export function showToast(msg: Omit<ToastMessage, 'id'>) {
  addToastFn?.(msg);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...msg, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-4 p-2 border-4 border-double ${
            toast.type === 'error'
              ? 'bg-[var(--nc-blue)] border-[var(--nc-yellow)] text-[var(--nc-yellow)]'
              : 'bg-[var(--nc-blue)] border-[var(--nc-white)] text-[var(--nc-white)]'
          }`}
        >
          <span className="text-sm flex-1 uppercase font-bold">{toast.type === 'error' ? '[ERROR]: ' : '[INFO]: '}{toast.message}</span>
          {toast.onRetry && (
            <button onClick={toast.onRetry} className="text-[var(--nc-yellow)] hover:bg-[var(--nc-yellow)] hover:text-black">
              [RETRY]
            </button>
          )}
          <button onClick={() => removeToast(toast.id)} className="text-[var(--nc-white)] hover:text-white">
            [X]
          </button>
        </div>
      ))}
    </div>
  );
}
