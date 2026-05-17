import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, X, User } from "lucide-react";
import useAsociadas from "../asociadas/useAsociadas";
import MapaAsociadas from "../asociadas/components/MapaAsociadas";
import { Input } from "../../shared/ui/Input";
import Badge from "../../shared/ui/Badge";

function MapaPage() {
  const { asociadas } = useAsociadas();
  const location = useLocation();
  const searchRef = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const initialRouteDest = location.state?.routeTo || null;

  const searchResults = query
    ? asociadas.filter((a) => a.lat != null && a.lng != null && (a.nombre.toLowerCase().includes(query.toLowerCase()) || (a.sector || "").toLowerCase().includes(query.toLowerCase())))
    : [];

  const mapItems = selectedId ? asociadas.filter((a) => a.id === selectedId) : undefined;

  const handleSelect = (a) => { setSelectedId(a.id); setQuery(a.nombre); setShowDropdown(false); };
  const handleClear = () => { setQuery(""); setSelectedId(null); setShowDropdown(false); };

  return (
    <section>
      <div className="hidden md:block md:mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-white text-sm font-bold">A</span>
          AgroMap
        </h2>
      </div>
      <div className="relative mb-1 md:mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input ref={searchRef}
            type="text"
            placeholder="Buscar persona o zona... (presiona /)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); setSelectedId(null); }}
            onFocus={() => setShowDropdown(true)}
            className="border-slate-200 bg-white pl-10 shadow-sm"
          />
          {query && (
            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {showDropdown && query && searchResults.length > 0 && (
          <div className="absolute z-[1000] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {searchResults.map((a) => (
              <button key={a.id} onClick={() => handleSelect(a)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-medium text-slate-900">{a.nombre}</span>
                <Badge variant="primary">{a.sector}</Badge>
              </button>
            ))}
          </div>
        )}
        {showDropdown && query && searchResults.length === 0 && (
          <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-lg">
            Sin resultados para &quot;{query}&quot;
          </div>
        )}
      </div>
      <MapaAsociadas filteredAsociadas={mapItems} initialRouteDest={initialRouteDest} />
    </section>
  );
}

export default MapaPage;
