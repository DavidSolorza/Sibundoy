import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl, CircleMarker, Circle, ScaleControl } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Sprout, Navigation, X, User, Clock, Route, Loader, Heart, Calendar, Crosshair, LocateFixed, Maximize2, Minimize2, Pencil, Trash2, Info } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import useAsociadas from "../useAsociadas";
import FormularioAsociada from "./FormularioAsociada";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useToast } from "../../../shared/ui/Toast";
import { markerIcon } from "./markerIcons";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function formatDuration(min) {
  if (min >= 60) { const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h} h ${m} min` : `${h} h`; }
  return `${min} min`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => { if (puntos.length > 0) { const bounds = L.latLngBounds(puntos); map.fitBounds(bounds, { padding: [60, 60] }); } }, [puntos, map]);
  return null;
}

function RouteLayer({ destination, origin, onInfo }) {
  const straightLine = [[origin.lat, origin.lng], [destination.lat, destination.lng]];
  const [coords, setCoords] = useState(straightLine);
  const [isApprox, setIsApprox] = useState(true);
  const fetched = useRef(null);
  const distKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);

  useEffect(() => {
    const key = `${destination.lat.toFixed(5)}-${destination.lng.toFixed(5)}-${origin.lat.toFixed(5)}-${origin.lng.toFixed(5)}`;
    if (fetched.current === key) return;
    fetched.current = key;
    onInfo({ distance: distKm.toFixed(1), duration: Math.round(distKm * 2), approximate: true });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false&alternatives=false`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timer);
        if (data.code === "Ok" && data.routes.length > 0) {
          const r = data.routes[0];
          setCoords(r.geometry.coordinates.map((c) => [c[1], c[0]]));
          setIsApprox(false);
          onInfo({ distance: (r.distance / 1000).toFixed(1), duration: Math.round(r.duration / 60), approximate: false });
        }
      })
      .catch(() => clearTimeout(timer));
  }, [destination, origin, onInfo, distKm]);

  return (
    <>
      <Polyline positions={coords} pathOptions={{ color: "#3b82f6", weight: isApprox ? 3 : 5, opacity: isApprox ? 0.4 : 0.85, dashArray: isApprox ? "10, 10" : undefined }} />
      <FitBounds puntos={coords} />
    </>
  );
}

function PopupContent({ asociada: a, onRoute, onEdit, onDelete }) {
  return (
    <div className="text-sm leading-relaxed min-w-[190px] max-w-[250px]">
      <p className="font-semibold text-[15px] mb-2.5 flex items-center gap-1.5">
        <User className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate">{a.nombre}</span>
      </p>
      <div className="space-y-1.5 text-slate-600 mb-3">
        <p className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="text-slate-400">Tipo:</span> {a.tipoPersona || "—"}</p>
        <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="text-slate-400">Sector:</span> {a.sector}</p>
        <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="text-slate-400">Tel:</span> {a.telefono || "—"}</p>
        <p className="flex items-center gap-1.5"><Sprout className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="text-slate-400">Huerta:</span> {a.areaHuerta || "—"}</p>
        <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="text-slate-400">Últ. visita:</span> {a.fechaUltimaVisita || "—"}</p>
      </div>
      <div className="flex gap-1.5">
        <button onClick={(e) => { e.stopPropagation(); onRoute([a.lat, a.lng]); }} className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 min-h-[36px]">
          <Navigation className="h-4 w-4" /> Ruta
        </button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(a); }} className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-amber-600 active:bg-amber-700 min-h-[36px]">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(a); }} className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-red-600 active:bg-red-700 min-h-[36px]">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LongPressHandler({ onLongPress }) {
  const map = useMap();
  const timerRef = useRef(null);
  const startPosRef = useRef(null);
  const pointersRef = useRef(new Set());

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const cancel = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } startPosRef.current = null; };
    const handleContextMenu = (e) => e.preventDefault();
    const handleDown = (e) => {
      pointersRef.current.add(e.pointerId);
      if (pointersRef.current.size > 1) { cancel(); return; }
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => { const latlng = map.mouseEventToLatLng(e); if (latlng) onLongPress(latlng); }, 600);
    };
    const handleUp = (e) => {
      pointersRef.current.delete(e.pointerId);
      cancel();
    };
    const handleMove = (e) => {
      if (!timerRef.current || !startPosRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (dx * dx + dy * dy > 100) cancel();
    };
    container.addEventListener("pointerdown", handleDown);
    container.addEventListener("pointerup", handleUp);
    container.addEventListener("pointercancel", handleUp);
    container.addEventListener("pointermove", handleMove);
    container.addEventListener("contextmenu", handleContextMenu);
    return () => {
      container.removeEventListener("pointerdown", handleDown);
      container.removeEventListener("pointerup", handleUp);
      container.removeEventListener("pointercancel", handleUp);
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("contextmenu", handleContextMenu);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, onLongPress]);

  return null;
}

function MapaAsociadas({ filteredAsociadas, initialRouteDest }) {
  const { asociadas: all, addAsociada, updateAsociada, deleteAsociada } = useAsociadas();
  const { showToast, ToastDisplay } = useToast();
  const items = filteredAsociadas || all;
  const [routeDest, setRouteDest] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [origin, setOrigin] = useState({ lat: 1.2035, lng: -76.9201 });
  const [accuracy, setAccuracy] = useState(null);
  const [formCoords, setFormCoords] = useState(null);
  const [editingAsociada, setEditingAsociada] = useState(null);
  const [deletingAsociada, setDeletingAsociada] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(true);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (initialRouteDest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRouteDest(initialRouteDest);
      setRouteInfo(null);
    }
  }, [initialRouteDest]);

  const handleLongPress = useCallback((latlng) => { setFormCoords({ lat: latlng.lat, lng: latlng.lng }); }, []);

  const handleSave = useCallback((asociada) => { addAsociada(asociada); showToast("Asociada agregada correctamente"); }, [addAsociada, showToast]);

  const handleUpdate = useCallback((asociada) => { updateAsociada(asociada.id, asociada); showToast("Asociada actualizada correctamente"); }, [updateAsociada, showToast]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setAccuracy(pos.coords.accuracy); },
        () => { showToast("No se pudo obtener tu ubicación", "error"); }
      );
    }
  }, [showToast]);

  const destination = useMemo(() => (routeDest ? { lat: routeDest[0], lng: routeDest[1] } : null), [routeDest]);

  const handleRoute = useCallback((dest) => {
    setRouteDest((prev) => { if (prev && prev[0] === dest[0] && prev[1] === dest[1]) return null; return dest; });
    setRouteInfo(null);
  }, []);

  const handleCloseRoute = useCallback(() => { setRouteDest(null); setRouteInfo(null); }, []);
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleEditAsociada = useCallback((a) => { setEditingAsociada(a); }, []);
  const handleDeleteRequest = useCallback((a) => { setDeletingAsociada(a); }, []);
  const handleConfirmDelete = useCallback(() => {
    if (deletingAsociada) { deleteAsociada(deletingAsociada.id); showToast("Asociada eliminada correctamente"); setDeletingAsociada(null); }
  }, [deletingAsociada, deleteAsociada, showToast]);
  const handleFormClose = useCallback(() => { setFormCoords(null); setEditingAsociada(null); }, []);

  const visibleMarkers = useMemo(() => {
    if (!routeDest) return items;
    const [dlat, dlng] = routeDest;
    return items.filter((a) => Math.abs(a.lat - dlat) < 0.0001 && Math.abs(a.lng - dlng) < 0.0001);
  }, [items, routeDest]);

  return (
    <div ref={containerRef} className="relative h-[calc(100dvh-7.5rem)] min-h-[250px] w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 lg:h-[600px]" style={{ touchAction: "manipulation" }}>
      {routeDest && (
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2">
          <button onClick={handleCloseRoute} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-md border border-slate-200 transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 min-h-[36px]">
            <X className="h-4 w-4" /> Cerrar ruta
          </button>
          {routeInfo && (
            <div className="inline-flex items-center gap-3 rounded-lg bg-white/90 px-3 py-2.5 text-xs shadow-md border border-slate-200 backdrop-blur-sm">
              <span className="flex items-center gap-1.5 text-slate-600"><Route className="h-4 w-4 text-blue-500" />{routeInfo.distance} km</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 text-slate-600"><Clock className="h-4 w-4 text-blue-500" />{formatDuration(routeInfo.duration)}</span>
              {routeInfo.approximate ? (
                <span className="flex items-center gap-1 text-amber-500 text-[10px] font-medium ml-1 animate-pulse"><Loader className="h-3 w-3 animate-spin" />optimizando...</span>
              ) : (
                <span className="text-emerald-500 text-[10px] font-medium ml-1">ruta real</span>
              )}
            </div>
          )}
        </div>
      )}
      {infoVisible && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md px-3 py-2 text-xs text-slate-600 max-w-[90%] sm:max-w-md">
          <Info className="h-4 w-4 shrink-0 text-blue-500" />
          <span className="leading-tight">Toca un marcador para ver detalles. Mantén presionado en un lugar vacío para añadir una nueva asociada. Usa dos dedos para moverte y acercarte.</span>
          <button onClick={() => setInfoVisible(false)} className="cursor-pointer shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <MapContainer center={[1.2035, -76.9201]} zoom={14} className="h-full w-full" doubleClickZoom={false} ref={mapRef}>
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Mapa Normal">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer attribution='&copy; <a href="https://www.esri.com/">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topográfico">
            <TileLayer attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
        </LayersControl>
        {!routeDest && <FitBounds puntos={items.map((a) => [a.lat, a.lng])} />}
        <ScaleControl position="bottomleft" />
        <LongPressHandler onLongPress={handleLongPress} />
        <MarkerClusterGroup chunkedLoading>
          {visibleMarkers.map((a) => (
            <Marker key={a.id} position={[a.lat, a.lng]} icon={markerIcon}>
              <Popup>
                <PopupContent asociada={a} onRoute={handleRoute} onEdit={handleEditAsociada} onDelete={handleDeleteRequest} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
        {routeDest && destination && (
          <RouteLayer key={`${routeDest[0].toFixed(5)}-${routeDest[1].toFixed(5)}`} destination={destination} origin={origin} onInfo={setRouteInfo} />
        )}
        {origin && accuracy && (
          <Circle center={[origin.lat, origin.lng]} radius={accuracy} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1, opacity: 0.3 }} />
        )}
        {origin && (
          <CircleMarker center={[origin.lat, origin.lng]} radius={7} pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}>
            <Popup>
              <div className="text-center font-medium text-sm text-slate-700 min-w-[120px]">
                Tu ubicación actual
                {accuracy && <p className="text-[10px] text-slate-400 mt-1">Precisión: ±{Math.round(accuracy)} m</p>}
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button onClick={() => { if (mapRef.current && origin) { mapRef.current.flyTo([origin.lat, origin.lng], 15); } }} className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-md transition-colors hover:bg-slate-50 active:bg-slate-100 border border-slate-200 min-h-[40px]" title="Centrar en mi ubicación">
          <LocateFixed className="h-4 w-4 text-blue-600" /> <span className="hidden sm:inline">Centrar aquí</span>
        </button>
        <button onClick={() => setFormCoords({ lat: origin.lat, lng: origin.lng })} className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-colors hover:bg-emerald-700 active:bg-emerald-800 min-h-[40px]" title="Añadir productora en mi ubicación">
          <Crosshair className="h-4 w-4" /> <span className="hidden sm:inline">Añadir aquí</span>
        </button>
        <button onClick={handleFullscreenToggle} className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-md transition-colors hover:bg-slate-50 active:bg-slate-100 border border-slate-200 min-h-[40px]" title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
          {isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-600" /> : <Maximize2 className="h-4 w-4 text-slate-600" />}
          <span className="hidden sm:inline">{isFullscreen ? "Salir" : "Pantalla completa"}</span>
        </button>
      </div>
      <FormularioAsociada open={!!formCoords} onClose={handleFormClose} onSave={handleSave} coords={formCoords || { lat: 0, lng: 0 }} />
      <FormularioAsociada key={editingAsociada?.id || "edit"} open={!!editingAsociada} onClose={handleFormClose} onSave={handleUpdate} coords={{ lat: editingAsociada?.lat || 0, lng: editingAsociada?.lng || 0 }} initialData={editingAsociada} />
      <ConfirmModal open={!!deletingAsociada} title="Eliminar asociada" message={`¿Estás seguro de eliminar a ${deletingAsociada?.nombre || ""}? Esta acción no se puede deshacer.`} onConfirm={handleConfirmDelete} onCancel={() => setDeletingAsociada(null)} />
      {ToastDisplay}
    </div>
  );
}

export default MapaAsociadas;
