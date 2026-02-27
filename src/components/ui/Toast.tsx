"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

/**
 * Toast Types
 */
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

/**
 * Toast Context
 */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: "success", title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: "error", title, message, duration: 8000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: "warning", title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: "info", title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Custom hook to use toast functionality
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }): React.JSX.Element {
  if (toasts.length === 0) {
    return <></>;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "400px",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item
 */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }): React.JSX.Element {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
      bg: "hsl(var(--color-success) / 0.1)",
      border: "hsl(var(--color-success))",
      icon: "✅",
    },
    error: {
      bg: "hsl(var(--color-error) / 0.1)",
      border: "hsl(var(--color-error))",
      icon: "❌",
    },
    warning: {
      bg: "hsl(var(--color-warning) / 0.1)",
      border: "hsl(var(--color-warning))",
      icon: "⚠️",
    },
    info: {
      bg: "hsl(var(--color-primary) / 0.1)",
      border: "hsl(var(--color-primary))",
      icon: "ℹ️",
    },
  };

  const style = colors[toast.type];

  return (
    <div
      style={{
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.25rem" }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontWeight: 600,
              marginBottom: toast.message ? "0.25rem" : 0,
              color: "hsl(var(--color-primary))",
            }}
          >
            {toast.title}
          </h4>
          {toast.message && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "hsl(var(--color-primary) / 0.7)",
                margin: 0,
              }}
            >
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            color: "hsl(var(--color-primary) / 0.5)",
            fontSize: "1.25rem",
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ToastProvider;
