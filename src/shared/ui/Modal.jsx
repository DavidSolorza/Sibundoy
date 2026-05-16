import { useEffect, useRef } from "react";
import { X } from "lucide-react";

function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-xl mt-16 sm:mt-0 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
