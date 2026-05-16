import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sprout, MapPin, User, Phone, Wheat, Heart, Users, Calendar, FileText, ClipboardList, Tag, Navigation, Plus, X, SlidersHorizontal, Crosshair, Check } from "lucide-react";
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

const SIBUNDOY = { lat: 1.2035, lng: -76.9201 };

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => { if (puntos.length > 0) { const bounds = L.latLngBounds(puntos); map.fitBounds(bounds, { padding: [60, 60] }); } }, [puntos, map]);
  return null;
}

function MapModal({ asociada, onClose }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  useEffect(() => { if (mapRef.current) { setTimeout(() => mapRef.current.invalidateSize(), 100); } }, []);

  return (
    <Modal open={!!asociada} onClose={onClose} title={asociada?.nombre || ""}>
      {asociada && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{asociada.sector}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{asociada.telefono}</span>
            <span className="flex items-center gap-1"><Wheat className="h-3.5 w-3.5 text-slate-400" />{asociada.areaHuerta}</span>
          </div>
          <button onClick={() => { onClose(); navigate("/", { state: { routeTo: [asociada.lat, asociada.lng] } }); }} className="w-full cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800">
            <Navigation className="h-3.5 w-3.5" /> Cómo llegar
          </button>
          <div className="h-[300px] w-full overflow-hidden rounded-lg border border-slate-200">
            <MapContainer ref={mapRef} center={[asociada.lat, asociada.lng]} zoom={16} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[asociada.lat, asociada.lng]} icon={markerIcon}>
                <Popup><p className="text-sm font-semibold">{asociada.nombre}</p><p className="text-xs text-slate-500">{asociada.sector}</p></Popup>
              </Marker>
              <FitBounds puntos={[[asociada.lat, asociada.lng]]} />
            </MapContainer>
          </div>
        </div>
      )}
    </Modal>
  );
}

const detailFields = [
  { label: "Tipo", key: "tipoPersona", icon: Heart }, { label: "Edad", key: "edad", icon: Tag },
  { label: "Teléfono", key: "telefono", icon: Phone }, { label: "Núm. Personas", key: "numPersonas", icon: Users },
  { label: "Sector", key: "sector", icon: MapPin }, { label: "Área Huerta", key: "areaHuerta", icon: Sprout },
  { label: "Productos", key: "productos", icon: Wheat }, { label: "Fecha Siembra", key: "fechaSiembra", icon: Calendar },
  { label: "Última Visita", key: "fechaUltimaVisita", icon: Calendar }, { label: "Núm. Visitas", key: "numVisitas", icon: ClipboardList },
  { label: "Observaciones", key: "observaciones", icon: FileText },
];

function DetailModal({ asociada, onClose }) {
  const navigate = useNavigate();
  return (
    <Modal open={!!asociada} onClose={onClose} title="Detalle de asociada">
      {asociada && (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-900 flex items-center gap-2"><User className="h-5 w-5 text-blue-600" />{asociada.nombre}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {detailFields.map(({ label, key, icon: Icon }) => (
              <div key={key} className={key === "productos" || key === "observaciones" ? "col-span-2" : ""}>
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-0.5"><Icon className="h-3 w-3" />{label}</p>
                <p className="text-sm text-slate-800">
                  {key === "sector" ? <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{asociada[key]}</span>
                    : key === "tipoPersona" ? <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{asociada[key]}</span>
                    : asociada[key]}
                </p>
              </div>
            ))}
          </div>
          <button onClick={() => { onClose(); navigate("/", { state: { routeTo: [asociada.lat, asociada.lng] } }); }} className="mt-2 w-full cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800">
            <Navigation className="h-4 w-4" /> Cómo llegar
          </button>
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
  const [coords, setCoords] = useState(SIBUNDOY);
  const mapRef = useRef(null);

  const handlePick = useCallback((c) => setCoords(c), []);

  useEffect(() => {
    if (open)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoords(SIBUNDOY);
  }, [open]);

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 100);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Ubicación en el mapa">
      <div className="space-y-3">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-slate-400" />
          Haz clic en el mapa para colocar la ubicación de la nueva asociada.
        </p>
        <div className="h-[350px] w-full overflow-hidden rounded-lg border border-slate-200">
          <MapContainer ref={mapRef} center={[SIBUNDOY.lat, SIBUNDOY.lng]} zoom={14} className="h-full w-full" doubleClickZoom={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickPicker onPick={handlePick} />
            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={markerIcon}>
                <Popup><p className="text-sm font-semibold">Ubicación seleccionada</p></Popup>
              </Marker>
            )}
            {coords && <FitBounds puntos={[[coords.lat, coords.lng]]} />}
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
            <Check className="h-4 w-4" /> Confirmar ubicación
          </button>
        </div>
      </div>
    </Modal>
  );
}

const SORTABLE_COLUMNS = [
  { key: "nombre", label: "Nombre" },
  { key: "tipoPersona", label: "Tipo" },
  { key: "sector", label: "Sector" },
  { key: "fechaUltimaVisita", label: "Última Visita" },
];

function HuertasPage() {
  const { asociadas, getSectores, addAsociada, updateAsociada, deleteAsociada } = useAsociadas();
  const { showToast, ToastDisplay } = useToast();
  const [query, setQuery] = useState("");
  const [activeSector, setActiveSector] = useState(null);
  const [mapAsociada, setMapAsociada] = useState(null);
  const [editingAsociada, setEditingAsociada] = useState(null);
  const [detailAsociada, setDetailAsociada] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [creatingCoords, setCreatingCoords] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deletingAsociada, setDeletingAsociada] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [page, setPage] = useState(0);
  const searchRef = useRef(null);
  const PER_PAGE = 10;
  const sectores = getSectores();
  const sectorNames = Object.keys(sectores);

  const hasActiveFilters = query || activeSector;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return asociadas.filter((a) => {
      const matchesSearch = !q
        || a.nombre?.toLowerCase().includes(q)
        || a.sector?.toLowerCase().includes(q)
        || a.telefono?.toLowerCase().includes(q)
        || a.tipoPersona?.toLowerCase().includes(q)
        || a.productos?.toLowerCase().includes(q);
      const matchesSector = !activeSector || a.sector === activeSector;
      return matchesSearch && matchesSector;
    });
  }, [asociadas, query, activeSector]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const clearFilters = useCallback(() => {
    setQuery("");
    setActiveSector(null);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    searchRef.current?.focus();
  }, []);

  const handleRowClick = useCallback((a) => {
    setDetailAsociada(a);
  }, []);

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
    <section>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 tracking-tight">
              <Sprout className="h-5 w-5 text-emerald-600" />
              Huertas
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Gestione los registros de las asociadas del programa.</p>
          </div>
          <button onClick={handleStartAdd} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 active:bg-slate-900">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input ref={searchRef} type="text" placeholder="Buscar por nombre, sector, teléfono, productos..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} className="pl-10 pr-10" />
              {query && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Limpiar búsqueda">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
              <button onClick={() => setActiveSector(null)}
                className={`cursor-pointer inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 snap-start ${
                  !activeSector ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                }`}>
                <Sprout className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">Todos</span>
                <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${!activeSector ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {asociadas.length}
                </span>
              </button>
              {sectorNames.map((sector) => {
                const isActive = activeSector === sector;
                return (
                  <button key={sector} onClick={() => { setActiveSector(isActive ? null : sector); setPage(0); }}
                    className={`cursor-pointer inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 snap-start ${
                      isActive ? "border-slate-800 bg-slate-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                    }`}>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="whitespace-nowrap">{sector}</span>
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {sectores[sector].length}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {sorted.length === 1 ? "1 resultado" : `${sorted.length} resultados`}
                  {activeSector && <> · Sector: <span className="font-medium text-slate-700">{activeSector}</span></>}
                  {query && <> · Búsqueda: "<span className="font-medium text-slate-700">{query}</span>"</>}
                </span>
                <button onClick={clearFilters} className="ml-auto cursor-pointer inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800">
                  <X className="h-3 w-3" /> Limpiar
                </button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{asociadas.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Filtrados</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{sorted.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Sectores</p>
            <p className="mt-0.5 text-xl font-bold text-slate-800">{uniqueSectores}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sprout className="h-4 w-4 text-emerald-600" />
              Registros
              {sorted.length !== asociadas.length && (
                <span className="text-xs font-normal text-slate-400">({sorted.length} de {asociadas.length})</span>
              )}
            </CardTitle>
          </CardHeader>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No se encontraron resultados</p>
              <p className="mt-1 text-xs text-slate-400">Prueba con otros términos de búsqueda o filtros.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-3 cursor-pointer inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700">
                  <X className="h-3 w-3" /> Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <TablaAsociadas data={paginated} onViewMap={(a) => setMapAsociada(a)} onEdit={(a) => setEditingAsociada(a)} onViewDetails={(a) => setDetailAsociada(a)} onDelete={(a) => setDeletingAsociada(a)} onRowClick={handleRowClick} sortBy={sortBy} onSort={handleSort} columns={SORTABLE_COLUMNS} />
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, sorted.length)} de {sorted.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setPage(i)} className={`cursor-pointer h-2 rounded-full transition-all duration-200 ${i === page ? "w-6 bg-slate-800" : "w-2 bg-slate-300 hover:bg-slate-400"}`} />
                      ))}
                    </div>
                    <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-slate-500 hover:text-slate-800 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <MapLocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onConfirm={handlePickerConfirm} />
      <MapModal asociada={mapAsociada} onClose={() => setMapAsociada(null)} />
      <DetailModal asociada={detailAsociada} onClose={() => setDetailAsociada(null)} />
      <ConfirmModal open={!!deletingAsociada} title="Eliminar asociada" message={`¿Estás seguro de eliminar a ${deletingAsociada?.nombre}? Esta acción no se puede deshacer.`}
        onConfirm={() => { deleteAsociada(deletingAsociada.id); setDeletingAsociada(null); showToast("Asociada eliminada correctamente"); }}
        onCancel={() => setDeletingAsociada(null)} />
      <FormularioAsociada key={editingAsociada?.id || "edit"} open={!!editingAsociada} onClose={() => setEditingAsociada(null)}
        onSave={(data) => { updateAsociada(editingAsociada.id, data); setEditingAsociada(null); showToast("Asociada actualizada correctamente"); }}
        coords={{ lat: 0, lng: 0 }} initialData={editingAsociada} />
      <FormularioAsociada key="create" open={creatingNew} onClose={handleFormClose}
        onSave={(data) => { addAsociada(data); setCreatingNew(false); setCreatingCoords(null); showToast("Asociada creada correctamente"); }}
        coords={creatingCoords || SIBUNDOY} />
      {ToastDisplay}
    </section>
  );
}

export default HuertasPage;
