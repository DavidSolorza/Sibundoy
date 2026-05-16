import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
/* eslint-disable react-refresh/only-export-components */

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-[9999] mx-auto flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 shadow-xl animate-slide-up sm:left-auto sm:right-6 sm:mx-0 sm:px-5 sm:py-3.5 pb-[env(safe-area-inset-bottom,0px)] ${
        type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 cursor-pointer rounded-lg p-0.5 opacity-70 hover:opacity-100 transition-opacity">
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
