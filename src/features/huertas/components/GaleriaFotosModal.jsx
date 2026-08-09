import { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Plus, Trash2, Camera, Loader2 } from "lucide-react";
import useAsociadas from "../../asociadas/useAsociadas";
import Modal from "../../../shared/ui/Modal";
import { api } from "../../../core/http/api";

export default function GaleriaFotosModal({ asociada, open, onClose }) {
  const { updateAsociada } = useAsociadas();
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  const fotos = asociada?.fotos || [];

  // Reset zoom and index on target change
  useEffect(() => {
    setActiveIndex(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [asociada]);

  const handleNext = useCallback(() => {
    if (fotos.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % fotos.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [fotos.length]);

  const handlePrev = useCallback(() => {
    if (fotos.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [fotos.length]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoom((z) => {
      const nextZoom = Math.max(z - 0.5, 1);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag to pan logic when zoomed
  const handleMouseDown = (e) => {
    if (zoom === 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom === 1) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newUrls = await Promise.all(
        files.map(async (file) => {
          const res = await api.uploadFoto(file);
          return res.publicUrl;
        })
      );
      
      const updatedFotos = [...fotos, ...newUrls];
      await updateAsociada(asociada.id, { ...asociada, fotos: updatedFotos });
      setActiveIndex(updatedFotos.length - 1);
    } catch (err) {
      console.error("Error upload:", err);
      alert("Error cargando la foto: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen de la galería?")) return;
    
    try {
      const fotoUrl = fotos[activeIndex];
      
      // Supabase storage delete logic removed as it is now handled differently or skipped
      // You may add api.deleteFoto(fotoUrl) later if implemented in backend
      
      const updatedFotos = fotos.filter((_, idx) => idx !== activeIndex);
      await updateAsociada(asociada.id, { ...asociada, fotos: updatedFotos });
      setActiveIndex((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error al eliminar la foto: " + err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Fotos de la Huerta: ${asociada?.nombre || ""}`} large>
      <div className="flex flex-col gap-4 select-none">
        
        {/* Main View Area */}
        <div className="relative h-[420px] w-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800">
          
          {fotos.length > 0 ? (
            <div 
              className={`h-full w-full flex items-center justify-center ${zoom > 1 ? "cursor-move" : ""}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src={fotos[activeIndex]} 
                alt={`Imagen ${activeIndex + 1}`}
                draggable={false}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? "none" : "transform 0.25s ease-out",
                }}
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
              
              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/50 text-white shadow-lg">
                <button onClick={handleZoomOut} disabled={zoom === 1} className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-40" title="Alejar">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-medium min-w-[35px] text-center">{zoom.toFixed(1)}x</span>
                <button onClick={handleZoomIn} disabled={zoom === 4} className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-40" title="Acercar">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-3.5 bg-slate-700" />
                <button onClick={handleZoomReset} disabled={zoom === 1} className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-40" title="Restablecer">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Delete Overlay */}
              <button 
                onClick={handleDelete}
                className="absolute top-4 right-4 cursor-pointer p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg flex items-center gap-1 text-xs font-semibold"
                title="Eliminar Foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>

              {/* Navigation Arrows */}
              {fotos.length > 1 && (
                <>
                  <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer h-10 w-10 flex items-center justify-center rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-white transition-colors" aria-label="Foto anterior">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer h-10 w-10 flex items-center justify-center rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700 text-white transition-colors" aria-label="Siguiente foto">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
              <Camera className="h-12 w-12 text-slate-600 stroke-[1.5]" />
              <div className="text-center">
                <p className="text-sm font-semibold">Sin Fotos Registradas</p>
                <p className="text-xs text-slate-500 mt-0.5">Sube imágenes para registrar el avance de la huerta.</p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Guardando foto en la huerta...</span>
            </div>
          )}
        </div>

        {/* Carousel & Actions Footer */}
        <div className="flex items-center gap-4 border-t border-slate-100 pt-3 flex-wrap">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Subir Foto
          </button>
          
          {fotos.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              Foto {activeIndex + 1} de {fotos.length}
            </span>
          )}

          {/* Thumbnail strip */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 max-w-[500px]">
            {fotos.map((foto, idx) => (
              <button 
                key={idx}
                onClick={() => { setActiveIndex(idx); setZoom(1); setPan({ x: 0, y: 0 }); }}
                className={`relative cursor-pointer shrink-0 h-11 w-11 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                  activeIndex === idx ? "border-slate-800 scale-105" : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={foto} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}
