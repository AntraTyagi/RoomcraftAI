import React, { useState, useEffect, createContext, useContext } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000;

type ToastActionElement = React.ReactElement<{
  className?: string;
  altText: string;
  onClick: () => void;
}>;

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

type ToasterToast = ToastProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ToastContext = createContext<{
  toasts: ToasterToast[];
  toast: (props: ToastProps) => void;
  dismiss: (toastId: string) => void;
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const toast = (props: ToastProps) => {
    const id = props.id || String(Math.random());
    
    setToasts((prevToasts) => {
      const newToast = {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss(id);
        },
      };

      // If there are already too many toasts, remove the oldest one
      if (prevToasts.length >= TOAST_LIMIT) {
        return [...prevToasts.slice(1), newToast];
      }
      
      return [...prevToasts, newToast];
    });

    return id;
  };

  const dismiss = (toastId: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === toastId
          ? { ...toast, open: false }
          : toast
      )
    );

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, TOAST_REMOVE_DELAY);
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
} 