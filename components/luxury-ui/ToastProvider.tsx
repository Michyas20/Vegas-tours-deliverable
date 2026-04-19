'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

/* ─── Icons ────────────────────────────────────────────────────────── */

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '#f59e0b' },
  info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: '#3b82f6' },
};

/* ─── Provider ─────────────────────────────────────────────────────── */

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    const newToast: Toast = { id, message, type, createdAt: Date.now() };

    setToasts((prev) => [...prev.slice(-2), newToast]); // max 3

    // Auto-dismiss after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* ── Toast Container (fixed bottom-right) ── */}
      <div className="vh-toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const colors = COLORS[toast.type];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="vh-toast-item"
                style={{
                  background: colors.bg,
                  borderLeft: `4px solid ${colors.border}`,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ color: colors.icon, flexShrink: 0 }}>
                  {ICONS[toast.type]}
                </div>
                <p style={{ flex: 1, margin: 0, fontSize: '0.9rem', color: '#1a1a2e', fontWeight: 500 }}>
                  {toast.message}
                </p>
                <button
                  onClick={() => dismiss(toast.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#888', flexShrink: 0, padding: '2px',
                  }}
                >
                  <X size={16} />
                </button>

                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '3px', background: colors.border,
                    transformOrigin: 'left', borderRadius: '0 0 0 8px',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
