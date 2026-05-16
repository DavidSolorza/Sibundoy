import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Crosshair, Check } from "lucide-react";
import Modal from "./Modal";

const SIBUNDOY = { lat: 1.2035, lng: -76.9201 };
const pickerIcon = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
  html: `<svg viewBox="0 0 28 40" width="28" height="40" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient><filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/></filter></defs><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#pg)" filter="url(#ps)"/><circle cx="14" cy="14" r="8" fill="#fff" opacity="0.95"/><circle cx="14" cy="14" r="5" fill="url(#pg)"/><circle cx="14" cy="14" r="1.5" fill="#fff" opacity="0.5"/></svg>`,
});

function FitBounds({ puntos }) {
  const map = useMap();
  useEffect(() => { if (puntos.length > 0) { const bounds = L.latLngBounds(puntos); map.fitBounds(bounds, { padding: [60, 60] }); } }, [puntos, map]);
  return null;
}

function ClickPicker({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function LocationPickerModal({ open, onClose, onConfirm, initialCoords }) {
  const [coords, setCoords] = useState(initialCoords || SIBUNDOY);
  const mapRef = useRef(null);

  const handlePick = useCallback((c) => setCoords(c), []);

  useEffect(() => {
    if (open) setCoords(initialCoords || SIBUNDOY);
  }, [open, initialCoords]);

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 100);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Seleccionar ubicación en el mapa">
      <div className="space-y-3">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-slate-400" />
          Haz clic en el mapa para cambiar la ubicación.
        </p>
        <div className="h-[350px] w-full overflow-hidden rounded-lg border border-slate-200">
          <MapContainer ref={mapRef} center={[coords.lat, coords.lng]} zoom={16} className="h-full w-full" doubleClickZoom={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickPicker onPick={handlePick} />
            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={pickerIcon}>
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

export default LocationPickerModal;
