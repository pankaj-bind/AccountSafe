import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastMessage, ToastContainer, ToastType } from '../components/ui/Toast';

interface ToastContextType {
  toast: {
    success: (message: string, options?: { duration?: number }) => void;
    error: (message: string, options?: { duration?: number }) => void;
    info: (message: string, options?: { duration?: number }) => void;
    warning: (message: string, options?: { duration?: number }) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, options?: { duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration: options?.duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toastMethods = {
    success: (message: string, options?: { duration?: number }) => addToast('success', message, options),
    error: (message: string, options?: { duration?: number }) => addToast('error', message, options),
    info: (message: string, options?: { duration?: number }) => addToast('info', message, options),
    warning: (message: string, options?: { duration?: number }) => addToast('warning', message, options),
  };

  // Register global window.toast to support legacy/hook patterns
  useEffect(() => {
    (window as any).toast = toastMethods;
    return () => {
      delete (window as any).toast;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
