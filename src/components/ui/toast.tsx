"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export type ToastOptions = {
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastRecord = {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  durationMs: number;
  visible: boolean;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastIcon(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.6-9.6-4.1 4.1a.8.8 0 0 1-1.1 0L6.4 10.6a.8.8 0 1 1 1.1-1.1l1.5 1.5 3.5-3.5a.8.8 0 0 1 1.1 1.1Z" />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm2.7-10.7a.8.8 0 0 0-1.1-1.1L10 7.9 8.4 6.3a.8.8 0 0 0-1.1 1.1L8.9 9l-1.6 1.6a.8.8 0 1 0 1.1 1.1L10 10.1l1.6 1.6a.8.8 0 0 0 1.1-1.1L11.1 9l1.6-1.7Z" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.9-10.6a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Zm-1.7 2.4a.8.8 0 0 1 .8-.8h.1a.8.8 0 0 1 .8.8v4a.8.8 0 1 1-1.7 0v-4Z" />
        </svg>
      );
  }
}

const toastVariantClasses: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800"
};

export type ToastProps = {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-full rounded-2xl border px-3 py-3 shadow-lg backdrop-blur",
        "transition duration-200 ease-out",
        toast.visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
        toastVariantClasses[toast.variant]
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">{toastIcon(toast.variant)}</span>

        <div className="min-w-0 flex-1">
          {toast.title ? (
            <p className="text-sm font-semibold leading-tight">{toast.title}</p>
          ) : null}
          <p className="text-sm leading-tight">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-current/70 transition hover:bg-black/5"
          aria-label="Dismiss notification"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m6 6 8 8m0-8-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );
    window.setTimeout(() => removeToast(id), 200);
  }, [removeToast]);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastRecord = {
        id,
        message,
        title: options?.title,
        variant: options?.variant ?? "info",
        durationMs: options?.durationMs ?? 3000,
        visible: false
      };

      setToasts((current) => [toast, ...current].slice(0, 3));

      window.requestAnimationFrame(() => {
        setToasts((current) =>
          current.map((item) => (item.id === id ? { ...item, visible: true } : item))
        );
      });

      timersRef.current[id] = window.setTimeout(() => {
        dismissToast(id);
      }, toast.durationMs);

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col gap-2 px-3 pt-[max(12px,env(safe-area-inset-top))]">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

