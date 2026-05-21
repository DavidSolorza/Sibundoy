import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

function Modal({ open, onClose, title, children, large }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const dragRef = useRef(null);
  const dragOccurred = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const onHeaderMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragOccurred.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const el = contentRef.current;
    if (!el) return;
    const onMove = (e) => {
      dragOccurred.current = true;
      const d = dragRef.current;
      if (!d) return;
      el.style.transform = `translate(${e.clientX - d.startX}px, ${e.clientY - d.startY}px)`;
    };
    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      if (el) el.style.transform = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current && !dragOccurred.current) onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; dragRef.current = null; setIsDragging(false); }
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
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={`flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-xl mt-16 sm:mt-0 pb-[env(safe-area-inset-bottom,0px)] ${large ? "max-w-3xl" : "max-w-lg"} ${isDragging ? "cursor-grabbing select-none" : ""}`}
      >
        <div
          className="flex cursor-grab items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4"
          onMouseDown={onHeaderMouseDown}
        >
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
