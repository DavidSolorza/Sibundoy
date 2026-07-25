import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sprout, MapPin, User, Phone, Wheat, Users, Calendar, FileText, ClipboardList, Tag, Navigation, Plus, X, SlidersHorizontal, Crosshair, Check, RefreshCw, LocateFixed, BarChart3, Image as ImageIcon } from "lucide-react";
import useDebounce from "../../shared/lib/useDebounce";
import { formatTimeAgo } from "../../shared/lib/dates";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../asociadas/useAsociadas";
import TablaAsociadas from "../asociadas/components/TablaAsociadas";
import FormularioAsociada from "../asociadas/components/FormularioAsociada";
import { markerIcon } from "../asociadas/components/markerIcons";
import { Input } from "../../shared/ui/Input";
import { Card, CardHeader, CardTitle } from "../../shared/ui/Card";
import Modal from "../../shared/ui/Modal";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useToast } from "../../shared/ui/Toast";
import useViewMode from "../../shared/lib/useViewMode";

// New components
import GaleriaFotosModal from "./components/GaleriaFotosModal";
import EstadisticasHuertas from "./components/EstadisticasHuertas";
import BuscadorSpotlight from "../../shared/ui/BuscadorSpotlight";

const DEFAULT_COORDS = { lat: 1.2035, lng: -76.9190 }; // Center in Sibundoy

function FitBoundsOnce({ puntos }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (puntos.length > 0 && !fitted.current) {
      fitted.current = true;
      const bounds = L.latLngBounds(puntos);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [puntos, map]);
  return null;
}

function MapModal({ asociada, onClose }) {
  const mapRef = useRef(null);
  useEffect(() => { 
    if (mapRef.current) { 
      setTimeout(() => mapRef.current.invalidateSize(), 100); 
    } 
  }, [asociada]);

  return (
    <Modal open={!!asociada} onClose={onClose} title={asociada?.nombre || ""} large>
      {asociada && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{asociada.sector}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{asociada.telefono}</span>
            <span className="flex items-center gap-1"><Wheat className="h-3.5 w-3.5 text-slate-400" />{asociada.areaHuerta}</span>
          </div>
          <div className="h-[400px] w-full overflow-hidden rounded-lg border border-slate-200">
            <MapContainer ref={mapRef} center={useMemo(() => [asociada.lat, asociada.lng], [asociada.lat, asociada.lng])} zoom={14} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[asociada.lat, asociada.lng]} icon={markerIcon}>
                <Popup><p className="text-sm font-semibold">{asociada.nombre}</p><p className="text-xs text-slate-500">{asociada.sector}</p></Popup>
              </Marker>
              <FitBoundsOnce puntos={[[asociada.lat, asociada.lng]]} />
            </MapContainer>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ClickPicker({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function MapLocationPicker({ open, onClose, onConfirm }) {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [fitKey, setFitKey] = useState(0);
  const mapRef = useRef(null);

  const handlePick = useCallback((c) => setCoords(c), []);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) { alert("Geolocalización no disponible en este navegador."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setFitKey(k => k + 1);
        mapRef.current?.flyTo([c.lat, c.lng], 16);
      },
      () => alert("No se pudo obtener tu ubicación. Verifica los permisos."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (open)
      setCoords(DEFAULT_COORDS);
  }, [open]);

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 100);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Ubicación En El Mapa">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-1">
            <Crosshair className="h-3.5 w-3.5 text-slate-400" />
            Haz clic en el mapa para colocar la ubicación de la nueva asociada.
          </p>
          <button type="button" onClick={handleLocate} className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50">
            <LocateFixed className="h-3.5 w-3.5" /> Aquí
          </button>
        </div>
        <div className="h-[350px] w-full overflow-hidden rounded-lg border border-slate-200">
          <MapContainer ref={mapRef} center={useMemo(() => [DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], [])} zoom={14} className="h-full w-full" doubleClickZoom={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickPicker onPick={handlePick} />
            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={markerIcon}>
                <Popup><p className="text-sm font-semibold">Ubicación Seleccionada</p></Popup>
              </Marker>
            )}
            {coords && <FitBoundsOnce key={fitKey} puntos={[[coords.lat, coords.lng]]} />}
          </MapContainer>
        </div>
        {coords && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100">
            Cancelar
          </button>
          <button onClick={() => onConfirm(coords)} className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 active:bg-slate-900">
            <Check className="h-4 w-4" /> Confirmar Ubicación
          </button>
        </div>
      </div>
    </Modal>
  );
}

const SORTABLE_COLUMNS = [
  { key: "nombre", label: "Nombre" },
  { key: "tipoPersona", label: "Estado Civil" },
  { key: "numPersonas", label: "Núm. Personas" },
  { key: "sector", label: "Sector" },
  { key: "productos", label: "Productos" },
];

function HuertasPage() {
  const { asociadas, loading, getSectores, addAsociada, updateAsociada, deleteAsociada, refresh, lastUpdated } = useAsociadas();
  const { showToast, ToastDisplay } = useToast();
  const { isViewOnly } = useViewMode();
  
  // Tab control: "tabla" or "estadisticas"
  const [activeTab, setActiveTab] = useState("tabla");
  
  // Temporal global filter: "todo", "diario", "semanal", "mensual", "anual"
  const [temporalFilter, setTemporalFilter] = useState("todo");

  // Search and view states
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [activeSector, setActiveSector] = useState(null);
  
  // Modals state
  const [mapAsociada, setMapAsociada] = useState(null);
  const [galleryAsociada, setGalleryAsociada] = useState(null);
  const [editingAsociada, setEditingAsociada] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [creatingCoords, setCreatingCoords] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deletingAsociada, setDeletingAsociada] = useState(null);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  // Column-based filters
  const [columnFilters, setColumnFilters] = useState({
    nombre: "",
    tipoPersona: "",
    sector: "",
    productos: "",
    numPersonas: "",
  });

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortBy, setSortBy] = useState(null);
  const [page, setPage] = useState(0);
  const searchRef = useRef(null);
  const PER_PAGE = 15;

  const sectores = getSectores();
  const sectorNames = Object.keys(sectores);

  const hasActiveFilters = query || activeSector || temporalFilter !== "todo" || Object.values(columnFilters).some(Boolean);

  // Open Spotlight Search hotkey listener
  useEffect(() => {
    const handleGlobalSearchKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalSearchKey);
    return () => window.removeEventListener("keydown", handleGlobalSearchKey);
  }, []);

  // Spotlight search selection callback
  const handleSpotlightSelect = (value, type) => {
    if (type === "asociada") {
      setQuery(value); // Filter table by name
      setPage(0);
    } else if (type === "sector") {
      setActiveSector(value); // Filter table by sector
      setPage(0);
    } else if (type === "producto") {
      setQuery(value); // Filter table by crop
      setPage(0);
    }
  };

  // Main filtered asociadas selector
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const now = new Date();

    return asociadas.filter((a) => {
      // Global Search
      const matchesSearch = !q
        || a.nombre?.toLowerCase().includes(q)
        || a.sector?.toLowerCase().includes(q)
        || a.telefono?.toLowerCase().includes(q)
        || a.tipoPersona?.toLowerCase().includes(q)
        || a.productos?.toLowerCase().includes(q);

      // Category Sector
      const matchesSector = !activeSector || a.sector === activeSector;

      // Temporal filter based on fechaUltimaVisita
      let matchesTemporal = true;
      if (temporalFilter !== "todo" && a.fechaUltimaVisita) {
        const lastVisDate = new Date(a.fechaUltimaVisita);
        const diffTime = Math.abs(now - lastVisDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (temporalFilter === "diario") matchesTemporal = diffDays <= 1;
        else if (temporalFilter === "semanal") matchesTemporal = diffDays <= 7;
        else if (temporalFilter === "mensual") matchesTemporal = diffDays <= 30;
        else if (temporalFilter === "anual") matchesTemporal = diffDays <= 365;
      } else if (temporalFilter !== "todo" && !a.fechaUltimaVisita) {
        matchesTemporal = false;
      }

      // Column Filters
      let matchesCol = true;
      if (columnFilters.nombre && !a.nombre?.toLowerCase().includes(columnFilters.nombre.toLowerCase())) matchesCol = false;
      if (columnFilters.tipoPersona && a.tipoPersona !== columnFilters.tipoPersona) matchesCol = false;
      if (columnFilters.sector && a.sector !== columnFilters.sector) matchesCol = false;
      if (columnFilters.productos && !a.productos?.toLowerCase().includes(columnFilters.productos.toLowerCase())) matchesCol = false;
      if (columnFilters.numPersonas && (a.numPersonas || 0) < parseInt(columnFilters.numPersonas)) matchesCol = false;

      return matchesSearch && matchesSector && matchesTemporal && matchesCol;
    });
  }, [asociadas, debouncedQuery, activeSector, temporalFilter, columnFilters]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    const { key, dir } = sortBy;
    return [...filtered].sort((a, b) => {
      const va = (a[key] || "").toString().toLowerCase();
      const vb = (b[key] || "").toString().toLowerCase();
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy]);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0)
      setPage(0);
  }, [page, totalPages]);

  const handleSort = useCallback((key) => {
    setSortBy((prev) => {
      if (prev && prev.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc" };
        return null;
      }
      return { key, dir: "asc" };
    });
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "/") { 
        e.preventDefault(); 
        searchRef.current?.focus(); 
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setActiveSector(null);
    setTemporalFilter("todo");
    setColumnFilters({ nombre: "", tipoPersona: "", sector: "", productos: "", numPersonas: "" });
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    searchRef.current?.focus();
  }, []);

  const toggleSelectRow = useCallback((id) => {
    if (id === "__all__") { setSelectedRows(new Set()); return; }
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      paginated.forEach((a) => next.add(a.id));
      return next;
    });
  }, [paginated]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedRows.size;
    if (count === 0) return;
    setDeletingBulk(true);
  }, [selectedRows]);

  const confirmBulkDelete = useCallback(async () => {
    const count = selectedRows.size;
    await Promise.all(Array.from(selectedRows).map((id) => deleteAsociada(id)));
    setSelectedRows(new Set());
    setDeletingBulk(false);
    showToast(`${count} asociada(s) eliminada(s)`);
  }, [selectedRows, deleteAsociada, showToast]);

  const handleStartAdd = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const handlePickerConfirm = useCallback((coords) => {
    setCreatingCoords(coords);
    setPickerOpen(false);
    setCreatingNew(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setCreatingNew(false);
    setCreatingCoords(null);
  }, []);

  const uniqueSectores = new Set(sorted.map((a) => a.sector)).size;

  return (
    <section className="space-y-6">
      
      {/* Title & Primary Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-800 tracking-tight">
            <Sprout className="h-6 w-6 text-emerald-600" />
            Huertas y Productoras
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Administra los registros técnicos y visualiza estadísticas integradas.</p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Spotlight triggering button */}
          <button 
            onClick={() => setSpotlightOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:bg-slate-100 hover:border-slate-300"
            title="Buscador inteligente (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            <span>Buscar (Ctrl+K)</span>
          </button>

          {!isViewOnly && (
            <button onClick={handleStartAdd} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 active:bg-slate-900">
              <Plus className="h-4 w-4" /> Agregar Huerta
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu & Temporal Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("tabla")}
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "tabla" 
                ? "bg-slate-800 text-white shadow-sm" 
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <FileText className="h-4 w-4" /> Registros
          </button>
          <button 
            onClick={() => setActiveTab("estadisticas")}
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "estadisticas" 
                ? "bg-slate-800 text-white shadow-sm" 
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Análisis y Gráficos
          </button>
        </div>

        {/* Global Temporal filter */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-400 font-semibold">Actividad reciente:</span>
          <select 
            value={temporalFilter} 
            onChange={(e) => { setTemporalFilter(e.target.value); setPage(0); }}
            className="cursor-pointer text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="todo">Toda la historia</option>
            <option value="diario">Hoy</option>
            <option value="semanal">Últimos 7 días</option>
            <option value="mensual">Últimos 30 días</option>
            <option value="anual">Último año</option>
          </select>
        </div>
      </div>

      {/* Premium KPIs Panel (Top cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Total Asociadas</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-800">{asociadas.length}</p>
            <span className="text-[11px] text-slate-400 font-medium">registradas</span>
          </div>
          <div className="absolute right-4 bottom-3 text-indigo-100/80">
            <Users className="h-10 w-10 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Filtrados</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-800">{sorted.length}</p>
            <span className="text-[11px] text-slate-400 font-medium">visibles</span>
          </div>
          <div className="absolute right-4 bottom-3 text-emerald-100/80">
            <SlidersHorizontal className="h-10 w-10 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Sectores Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-800">{uniqueSectores}</p>
            <span className="text-[11px] text-slate-400 font-medium">de {sectorNames.length}</span>
          </div>
          <div className="absolute right-4 bottom-3 text-amber-100/80">
            <MapPin className="h-10 w-10 stroke-[1.5]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actualizado</p>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">{lastUpdated ? formatTimeAgo(lastUpdated) : "—"}</p>
          </div>
          <button onClick={refresh} disabled={loading} className="cursor-pointer rounded-xl p-2 bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 disabled:cursor-default" title="Actualizar datos">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

      </div>

      {/* Main View Render */}
      {activeTab === "tabla" ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="space-y-3">
              {/* Search Bar / Sector selection strip */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input ref={searchRef} type="text" placeholder="Búsqueda rápida por nombre, teléfono o cultivo..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} className="pl-10 pr-10 border-slate-300 focus:border-slate-800 focus:ring-slate-800 rounded-xl" />
                {query && (
                  <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Limpiar Búsqueda">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Veredas Horizontal Buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
                <button onClick={() => { setActiveSector(null); setPage(0); }}
                  className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 snap-start ${
                    !activeSector ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                  }`}>
                  <Sprout className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Todos</span>
                  <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${!activeSector ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {asociadas.length}
                  </span>
                </button>
                {sectorNames.map((sector) => {
                  const isActive = activeSector === sector;
                  return (
                    <button key={sector} onClick={() => { setActiveSector(isActive ? null : sector); setPage(0); }}
                      className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 snap-start ${
                        isActive ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                      }`}>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{sector.replace("Vereda ", "")}</span>
                      <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {sectores[sector].length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filters State */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {sorted.length === 1 ? "1 resultado" : `${sorted.length} resultados`}
                    {activeSector && <> · Sector: <span className="font-bold text-slate-700">{activeSector}</span></>}
                    {query && <> · Búsqueda: "<span className="font-bold text-slate-700">{query}</span>"</>}
                    {temporalFilter !== "todo" && <> · Temporal: <span className="font-bold text-slate-700">{temporalFilter}</span></>}
                    {Object.entries(columnFilters).filter(([_, v]) => v).length > 0 && (
                      <> · Filtros columna: <span className="font-bold text-slate-700">{Object.entries(columnFilters).filter(([_, v]) => v).map(([k, v]) => `${k}:${v}`).join(", ")}</span></>
                    )}
                  </span>
                  <button onClick={clearFilters} className="ml-auto cursor-pointer inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800">
                    <X className="h-3 w-3" /> Limpiar Todo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Sprout className="h-5 w-5 text-emerald-600" />
                Registros de Huertas
                {sorted.length !== asociadas.length && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-widest">{sorted.length} visibles</span>
                )}
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-700">No se encontraron resultados</p>
                <p className="mt-1.5 text-xs font-medium text-slate-400">Prueba con otros filtros o verifica los filtros de columna.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700 shadow-sm hover:scale-105 active:scale-95">
                    <X className="h-3.5 w-3.5" /> Limpiar Filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <TablaAsociadas 
                  data={paginated} 
                  onViewMap={(a) => setMapAsociada(a)} 
                  onViewGallery={(a) => setGalleryAsociada(a)}
                  onEdit={(a) => setEditingAsociada(a)} 
                  onDelete={(a) => setDeletingAsociada(a)} 
                  sortBy={sortBy} 
                  onSort={handleSort} 
                  columns={SORTABLE_COLUMNS} 
                  viewOnly={isViewOnly}
                  selectedRows={selectedRows} 
                  onToggleSelect={toggleSelectRow} 
                  onBulkDelete={handleBulkDelete} 
                  onSelectAll={handleSelectAll} 
                  columnFilters={columnFilters}
                  onColumnFilterChange={setColumnFilters}
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                      Mostrando {page * PER_PAGE + 1} – {Math.min((page + 1) * PER_PAGE, sorted.length)} de {sorted.length}
                    </span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-md hover:bg-slate-200">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button key={i} onClick={() => setPage(i)} className={`cursor-pointer h-2 rounded-full transition-all duration-300 ${i === page ? "w-6 bg-slate-800" : "w-2 bg-slate-300 hover:bg-slate-400"}`} />
                        ))}
                      </div>
                      <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-md hover:bg-slate-200">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Analytics view */
        <EstadisticasHuertas asociadas={sorted} temporalFilter={temporalFilter} />
      )}

      {/* Modals & Picker */}
      <MapLocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} />
      <MapModal asociada={mapAsociada} onClose={() => setMapAsociada(null)} />
      
      <GaleriaFotosModal asociada={galleryAsociada} open={!!galleryAsociada} onClose={() => setGalleryAsociada(null)} />

      <ConfirmModal open={!!deletingAsociada} title="Eliminar Asociada" message={`¿Estás seguro de eliminar a ${deletingAsociada?.nombre}? Esta acción no se puede deshacer.`}
        onConfirm={async () => { try { await deleteAsociada(deletingAsociada.id); setDeletingAsociada(null); showToast("Asociada Eliminada Correctamente"); } catch { showToast("Error Al Eliminar"); } }}
        onCancel={() => setDeletingAsociada(null)} variant="danger" confirmLabel="Eliminar" />
      
      <ConfirmModal open={deletingBulk} title="Eliminar Asociadas" message={`¿Eliminar ${selectedRows.size} asociada(s)? Esta acción no se puede deshacer.`}
        onConfirm={confirmBulkDelete} onCancel={() => setDeletingBulk(false)} variant="warning" confirmLabel={`Eliminar ${selectedRows.size}`} />
      
      <FormularioAsociada key={editingAsociada?.id || "edit"} open={!!editingAsociada} onClose={() => setEditingAsociada(null)}
        onSave={async (data) => { try { await updateAsociada(editingAsociada.id, data); setEditingAsociada(null); showToast("Asociada Actualizada Correctamente"); } catch { showToast("Error Al Actualizar"); } }}
        coords={{ lat: 0, lng: 0 }} initialData={editingAsociada} />
      
      <FormularioAsociada key="create" open={creatingNew} onClose={handleFormClose}
        onSave={async (data) => { try { await addAsociada(data); setCreatingNew(false); setCreatingCoords(null); showToast("Asociada Creada Correctamente"); } catch { showToast("Error Al Crear"); } }}
        coords={creatingCoords || DEFAULT_COORDS} />

      <BuscadorSpotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} onSelectAsociada={handleSpotlightSelect} />

      {ToastDisplay}
    </section>
  );
}

export default HuertasPage;
