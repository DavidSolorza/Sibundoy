import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sprout, MapPin, User, Phone, Wheat, Heart, Users, Calendar, FileText, ClipboardList, Tag, Navigation, Plus } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../hooks/useAsociadas";
import Tabla from "../components/Table/Tabla";
import FormularioAsociada from "../components/Map/FormularioAsociada";
import { markerIcon } from "../components/Map/markerIcons";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useToast } from "../components/ui/Toast";

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length > 0) {
      const bounds = L.latLngBounds(puntos);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [puntos, map]);
  return null;
}

function MapModal({ asociada, onClose }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 100);
    }
  }, []);

  return (
    <Modal open={!!asociada} onClose={onClose} title={asociada?.nombre || ""}>
      {asociada && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {asociada.sector}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {asociada.telefono}
            </span>
            <span className="flex items-center gap-1">
              <Wheat className="h-3.5 w-3.5 text-gray-400" />
              {asociada.areaHuerta}
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              navigate("/", { state: { routeTo: [asociada.lat, asociada.lng] } });
            }}
            className="w-full cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <Navigation className="h-3.5 w-3.5" />
            Cómo llegar
          </button>
          <div className="h-[300px] w-full overflow-hidden rounded-lg border border-gray-200">
            <MapContainer
              ref={mapRef}
              center={[asociada.lat, asociada.lng]}
              zoom={16}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[asociada.lat, asociada.lng]} icon={markerIcon}>
                <Popup>
                  <p className="text-sm font-semibold">{asociada.nombre}</p>
                  <p className="text-xs text-gray-500">{asociada.sector}</p>
                </Popup>
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
  { label: "Nombre", key: "nombre", icon: User },
  { label: "Tipo", key: "tipoPersona", icon: Heart },
  { label: "Edad", key: "edad", icon: Tag },
  { label: "Teléfono", key: "telefono", icon: Phone },
  { label: "Núm. Personas", key: "numPersonas", icon: Users },
  { label: "Sector", key: "sector", icon: MapPin },
  { label: "Área Huerta", key: "areaHuerta", icon: Sprout },
  { label: "Productos", key: "productos", icon: Wheat },
  { label: "Fecha Siembra", key: "fechaSiembra", icon: Calendar },
  { label: "Última Visita", key: "fechaUltimaVisita", icon: Calendar },
  { label: "Núm. Visitas", key: "numVisitas", icon: ClipboardList },
  { label: "Observaciones", key: "observaciones", icon: FileText },
];

function DetailModal({ asociada, onClose }) {
  const navigate = useNavigate();

  return (
    <Modal open={!!asociada} onClose={onClose} title="Detalle de asociada">
      {asociada && (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {asociada.nombre}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {detailFields.slice(1).map(({ label, key, icon: Icon }) => (
              <div key={key} className={key === "productos" || key === "observaciones" ? "col-span-2" : ""}>
                <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mb-0.5">
                  <Icon className="h-3 w-3" />
                  {label}
                </p>
                <p className="text-sm text-gray-800">
                  {key === "sector" || key === "tipoPersona" ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      key === "sector" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {asociada[key]}
                    </span>
                  ) : (
                    asociada[key]
                  )}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              onClose();
              navigate("/", { state: { routeTo: [asociada.lat, asociada.lng] } });
            }}
            className="mt-2 w-full cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <Navigation className="h-4 w-4" />
            Cómo llegar
          </button>
        </div>
      )}
    </Modal>
  );
}

function HuertasPage() {
  const { asociadas, getSectores, addAsociada, updateAsociada, deleteAsociada } = useAsociadas();
  const { showToast, ToastDisplay } = useToast();
  const [query, setQuery] = useState("");
  const [activeSector, setActiveSector] = useState(null);
  const [mapAsociada, setMapAsociada] = useState(null);
  const [editingAsociada, setEditingAsociada] = useState(null);
  const [detailAsociada, setDetailAsociada] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deletingAsociada, setDeletingAsociada] = useState(null);
  const sectores = getSectores();
  const sectorNames = Object.keys(sectores);

  const filtered = asociadas.filter((a) => {
    const q = query.toLowerCase();
    const matchesSearch =
      !q ||
      a.nombre?.toLowerCase().includes(q) ||
      a.sector?.toLowerCase().includes(q);
    const matchesSector = !activeSector || a.sector === activeSector;
    return matchesSearch && matchesSector;
  });

  const [page, setPage] = useState(0);
  const PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(0);
  }, [page, totalPages]);

  return (
    <section>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Sprout className="h-6 w-6 text-emerald-600" />
              Huertas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Busque, filtre por sector y gestione los registros de asociadas.
            </p>
          </div>
          <button
            onClick={() => setCreatingNew(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o sector..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sectorNames.map((sector) => {
                const isActive = activeSector === sector;
                return (
                  <button
                    key={sector}
                    onClick={() => setActiveSector(isActive ? null : sector)}
                    className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:shadow-sm"
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    {sector}
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {sectores[sector].length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sprout className="h-4 w-4 text-emerald-600" />
              Registros {filtered.length !== asociadas.length && `(${filtered.length})`}
            </CardTitle>
          </CardHeader>
          <Tabla data={paginated} onViewMap={(a) => setMapAsociada(a)} onEdit={(a) => setEditingAsociada(a)} onViewDetails={(a) => setDetailAsociada(a)} onDelete={(a) => setDeletingAsociada(a)} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`cursor-pointer h-2 rounded-full transition-all duration-200 ${
                      i === page
                        ? "w-6 bg-slate-800"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="cursor-pointer disabled:opacity-30 disabled:cursor-default text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </Card>
      </div>

      <MapModal asociada={mapAsociada} onClose={() => setMapAsociada(null)} />
      <DetailModal asociada={detailAsociada} onClose={() => setDetailAsociada(null)} />

      <ConfirmModal
        open={!!deletingAsociada}
        title="Eliminar asociada"
        message={`¿Estás seguro de eliminar a ${deletingAsociada?.nombre}? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteAsociada(deletingAsociada.id);
          setDeletingAsociada(null);
          showToast("Asociada eliminada correctamente");
        }}
        onCancel={() => setDeletingAsociada(null)}
      />

      <FormularioAsociada
        key={editingAsociada?.id || "new"}
        open={!!editingAsociada}
        onClose={() => setEditingAsociada(null)}
        onSave={(data) => {
          updateAsociada(editingAsociada.id, data);
          setEditingAsociada(null);
          showToast("Asociada actualizada correctamente");
        }}
        coords={{ lat: 0, lng: 0 }}
        initialData={editingAsociada}
      />

      <FormularioAsociada
        key="create"
        open={creatingNew}
        onClose={() => setCreatingNew(false)}
        onSave={(data) => {
          addAsociada(data);
          setCreatingNew(false);
          showToast("Asociada creada correctamente");
        }}
        coords={{ lat: 1.2035, lng: -76.9201 }}
      />

      {ToastDisplay}
    </section>
  );
}

export default HuertasPage;
