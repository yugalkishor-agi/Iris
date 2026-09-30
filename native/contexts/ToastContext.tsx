import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastProps } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (options: Omit<ToastProps, 'visible' | 'onHide'>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (options: Omit<ToastProps, 'visible' | 'onHide'>) => {
    setToast((current) => {
      if (current?.visible) {
        return {
          ...current,
          visible: false,
          onHide: hideToast,
        };
      }

      return {
        ...options,
        visible: true,
        onHide: hideToast,
      };
    });

    setTimeout(() => {
      setToast({
        ...options,
        visible: true,
        onHide: hideToast,
      });
    }, 25);
  };

  const hideToast = () => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
    setTimeout(() => setToast(null), 500);
  };

  const contextValue = { showToast, hideToast };

  React.useEffect(() => {
    setGlobalToastRef(contextValue);
    return () => setGlobalToastRef(null as any);
  }, []);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && <Toast {...toast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

let globalToastRef: ToastContextType | null = null;

export function setGlobalToastRef(ref: ToastContextType) {
  globalToastRef = ref;
}

export const toast = {
  success: (message: string, options?: Partial<ToastProps>) => {
    globalToastRef?.showToast({ message, type: 'success', ...options });
  },
  error: (message: string, options?: Partial<ToastProps>) => {
    globalToastRef?.showToast({ message, type: 'error', ...options });
  },
  warning: (message: string, options?: Partial<ToastProps>) => {
    globalToastRef?.showToast({ message, type: 'warning', ...options });
  },
  info: (message: string, options?: Partial<ToastProps>) => {
    globalToastRef?.showToast({ message, type: 'info', ...options });
  },
  notification: (options: Omit<ToastProps, 'visible' | 'onHide' | 'variant'>) => {
    globalToastRef?.showToast({
      ...options,
      variant: 'notification',
    });
  },
};
