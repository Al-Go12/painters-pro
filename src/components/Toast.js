'use client';

import { useState, useCallback, useEffect } from 'react';

/* ── Hook ── */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3500);
    return id;
  }, [dismiss]);

  return { toasts, toast, dismiss };
}

/* ── Single toast item ── */
function ToastItem({ id, message, type, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isSuccess = type === 'success';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-lg border text-sm font-medium w-full max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      } ${
        isSuccess
          ? 'bg-white border-green-200'
          : 'bg-white border-red-200'
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        isSuccess ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {isSuccess ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Message */}
      <span className={`flex-1 leading-snug ${isSuccess ? 'text-green-900' : 'text-red-800'}`}>
        {message}
      </span>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 mt-0.5 p-0.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ── Container ── */
export function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none sm:right-5 sm:top-5">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
