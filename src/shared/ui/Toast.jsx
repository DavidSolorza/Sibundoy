import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const STYLES = {
  success: {
    bg: "bg-emerald-600",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-red-600",
    Icon: XCircle,
  },
  warning: {
    bg: "bg-amber-600",
    Icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-600",
    Icon: Info,
  },
};

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const style = STYLES[type] || STYLES.success;
  const Icon = style.Icon;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 shadow-xl animate-slide-in-right sm:px-5 sm:py-3.5 ${style.bg} text-white`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto cursor-pointer rounded-lg p-0.5 opacity-70 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const ToastDisplay = toast ? (
    <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastDisplay };
}

export { Toast, useToast };
