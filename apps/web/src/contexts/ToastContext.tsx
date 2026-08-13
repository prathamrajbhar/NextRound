'use client';

import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />,
    className: 'border-emerald-100 bg-emerald-50/90',
  },
  error: {
    icon: <AlertCircle className="h-4.5 w-4.5 text-rose-600" />,
    className: 'border-rose-100 bg-rose-50/90',
  },
  info: {
    icon: <AlertTriangle className="h-4.5 w-4.5 text-indigo-600" />,
    className: 'border-indigo-100 bg-indigo-50/90',
  },
};







export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant: 'info', duration: 4000, ...options }]);
      window.setTimeout(() => dismiss(id), options.duration ?? 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((t) => {
              const style = variantStyles[t.variant ?? 'info'];
              return (
                <div
                  key={t.id}
                  role="status"
                  className={cn(
                    'pointer-events-auto flex items-start gap-2.5 rounded-2xl border p-3.5 shadow-lg backdrop-blur-md anim-slide-in-right',
                    style.className
                  )}
                >
                  <span className="mt-0.5 flex-shrink-0">{style.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-800">{t.title}</p>
                    {t.description && <p className="text-[11px] font-medium text-slate-600 mt-0.5">{t.description}</p>}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="text-slate-400 hover:text-slate-700 cursor-pointer flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
}
