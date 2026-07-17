import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, MapPin, Wheat, CornerDownLeft, Sparkles, X } from "lucide-react";
import useAsociadas from "../../features/asociadas/useAsociadas";

export default function BuscadorSpotlight({ open, onClose, onSelectAsociada }) {
  const navigate = useNavigate();
  const { asociadas } = useAsociadas();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Handle hotkeys (Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Normalize text for search
  const normalize = (text) => 
    text?.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

  // Perform search across name, sector, and products
  const filteredResults = useMemo(() => {
    if (!query.trim()) return { asociadas: [], sectores: [], productos: [], totalCount: 0 };
    const q = normalize(query);

    const matchAsoc = [];
    const matchSectores = new Set();
    const matchProductos = [];

    asociadas.forEach((a) => {
      const normNombre = normalize(a.nombre);
      const normSector = normalize(a.sector);
      const normProductos = normalize(a.productos);
      const normTel = normalize(a.telefono);

      // Match Asociadas
      if (normNombre.includes(q) || normTel.includes(q)) {
        matchAsoc.push({ type: "asociada", id: a.id, title: a.nombre, subtitle: `${a.sector} · ${a.telefono || "Sin Teléfono"}` });
      }

      // Match Sectores
      if (normSector.includes(q) && !matchSectores.has(a.sector)) {
        matchSectores.add(a.sector);
      }

      // Match Productos
      if (normProductos.includes(q)) {
        // Find matching crop word
        const matchingCrop = a.productos.split(",")
          .map(p => p.trim())
          .find(p => normalize(p).includes(q));
          
        if (matchingCrop) {
          matchProductos.push({
            type: "producto",
            id: `${a.id}-prod-${matchingCrop}`,
            asociadaId: a.id,
            asociadaNombre: a.nombre,
            title: matchingCrop.charAt(0).toUpperCase() + matchingCrop.slice(1),
            subtitle: `Cultivado por ${a.nombre} (${a.sector})`
          });
        }
      }
    });

    const sectoresList = Array.from(matchSectores).map(name => ({
      type: "sector",
      id: `sector-${name}`,
      title: name,
      subtitle: `Filtrar huertas por sector`
    }));

    const totalList = [...matchAsoc, ...sectoresList, ...matchProductos.slice(0, 5)];

    return {
      asociadas: matchAsoc,
      sectores: sectoresList,
      productos: matchProductos.slice(0, 5),
      flatList: totalList,
      totalCount: totalList.length
    };
  }, [asociadas, query]);

  // Navigate selection via Keyboard
  const handleKeyDown = (e) => {
    if (filteredResults.totalCount === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredResults.totalCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredResults.totalCount) % filteredResults.totalCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredResults.flatList[activeIndex];
      if (selectedItem) handleSelect(selectedItem);
    }
  };

  const handleSelect = (item) => {
    onClose();
    if (item.type === "asociada") {
      if (onSelectAsociada) onSelectAsociada(item.title, "asociada");
      else navigate(`/asociada/${item.id}`);
    } else if (item.type === "sector") {
      if (onSelectAsociada) onSelectAsociada(item.title, "sector");
    } else if (item.type === "producto") {
      if (onSelectAsociada) onSelectAsociada(item.title, "producto");
    }
  };

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === containerRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div 
      ref={containerRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-start justify-center pt-24 px-4"
    >
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[500px]"
        onKeyDown={handleKeyDown}
      >
        {/* Search header input */}
        <div className="relative flex items-center border-b border-slate-100 p-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por asociada, vereda, productos de huerta..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            className="w-full pl-10 pr-10 py-1.5 text-base border-none focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 font-medium"
          />
          <button 
            onClick={onClose} 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="h-10 w-10 text-slate-300 mx-auto stroke-[1.5] mb-2" />
              <p className="text-xs font-semibold">Buscador Inteligente Global</p>
              <p className="text-[11px] text-slate-400/80 mt-0.5">Escribe para encontrar productoras, sectores o cultivos asociados.</p>
            </div>
          ) : filteredResults.totalCount === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No se encontraron resultados</p>
              <p className="text-xs text-slate-400/80 mt-0.5">Prueba buscando otros términos o verifica la ortografía.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Category: Asociadas */}
              {filteredResults.asociadas.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">Asociadas</h4>
                  <div className="space-y-0.5">
                    {filteredResults.asociadas.map((item) => {
                      const flatIndex = filteredResults.flatList.findIndex(x => x.id === item.id);
                      const isFocused = flatIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                            isFocused ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isFocused ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                          </div>
                          {isFocused && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category: Sectores */}
              {filteredResults.sectores.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">Sectores / Veredas</h4>
                  <div className="space-y-0.5">
                    {filteredResults.sectores.map((item) => {
                      const flatIndex = filteredResults.flatList.findIndex(x => x.id === item.id);
                      const isFocused = flatIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                            isFocused ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isFocused ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"}`}>
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                          </div>
                          {isFocused && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category: Productos */}
              {filteredResults.productos.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-1.5">Cultivos</h4>
                  <div className="space-y-0.5">
                    {filteredResults.productos.map((item) => {
                      const flatIndex = filteredResults.flatList.findIndex(x => x.id === item.id);
                      const isFocused = flatIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                            isFocused ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isFocused ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"}`}>
                            <Wheat className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                          </div>
                          {isFocused && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">↑↓</span> Navegar</span>
            <span className="flex items-center gap-1"><span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">Enter</span> Seleccionar</span>
          </div>
          <div>
            <span className="flex items-center gap-1"><span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">Esc</span> Cerrar</span>
          </div>
        </div>

      </div>
    </div>
  );
}
