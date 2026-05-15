import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Sprout, Wheat, Navigation, X, User, Clock, Route, Loader, Heart, Users, Calendar, FileText, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../../hooks/useAsociadas";
import FormularioAsociada from "./FormularioAsociada";

const markerIcon = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
  html: `<svg viewBox="0 0 28 40" width="28" height="40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#g)" filter="url(#s)"/>
    <circle cx="14" cy="14" r="8" fill="#fff" opacity="0.95"/>
    <circle cx="14" cy="14" r="5" fill="url(#g)"/>
    <circle cx="14" cy="14" r="1.5" fill="#fff" opacity="0.5"/>
  </svg>`,
});

const tempMarkerIcon = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
  html: `<svg viewBox="0 0 28 40" width="28" height="40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f87171"/>
        <stop offset="100%" stop-color="#dc2626"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#g)" filter="url(#s)"/>
    <circle cx="14" cy="14" r="8" fill="#fff" opacity="0.95"/>
    <circle cx="14" cy="14" r="5" fill="url(#g)"/>
    <circle cx="14" cy="14" r="1.5" fill="#fff" opacity="0.5"/>
  </svg>`,
});

function formatDuration(min) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  return `${min} min`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

function RouteLayer({ destination, origin, onInfo }) {
  const straightLine = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ];

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

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false&alternatives=false`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timer);
        if (data.code === "Ok" && data.routes.length > 0) {
          const r = data.routes[0];
          setCoords(r.geometry.coordinates.map((c) => [c[1], c[0]]));
          setIsApprox(false);
          onInfo({
            distance: (r.distance / 1000).toFixed(1),
            duration: Math.round(r.duration / 60),
            approximate: false,
          });
        }
      })
      .catch(() => clearTimeout(timer));
  }, [destination, origin, onInfo, distKm]);

  return (
    <>
      <Polyline
        positions={coords}
        pathOptions={{
          color: "#3b82f6",
          weight: isApprox ? 3 : 5,
          opacity: isApprox ? 0.4 : 0.85,
          dashArray: isApprox ? "10, 10" : undefined,
        }}
      />
      <FitBounds puntos={coords} />
    </>
  );
}

function PopupContent({ asociada: a, onRoute }) {
  return (
    <div className="text-sm leading-relaxed min-w-[200px] max-w-[240px]">
      <p className="font-semibold text-base mb-2 flex items-center gap-1.5">
        <User className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate">{a.nombre}</span>
      </p>
      <div className="space-y-1 text-gray-600 mb-3">
        <p className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Tipo:</span> {a.tipoPersona}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Sector:</span> {a.sector}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Tel:</span> {a.telefono}
        </p>
        <p className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Personas:</span> {a.numPersonas}
        </p>
        <p className="flex items-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Huerta:</span> {a.areaHuerta}
        </p>
        <p className="flex items-center gap-1.5">
          <Wheat className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Productos:</span> {a.productos}
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Visita:</span> {a.fechaUltimaVisita}
        </p>
        <p className="flex items-start gap-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
          <span className="text-gray-400">Obs:</span> {a.observaciones}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRoute([a.lat, a.lng]);
        }}
        className="cursor-pointer w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800"
      >
        <Navigation className="h-3.5 w-3.5" />
        Cómo llegar
      </button>
    </div>
  );
}

function ClickHandler({ onClick }) {
  useMapEvents({ dblclick: onClick });
  return null;
}

function Mapa({ filteredAsociadas, initialRouteDest }) {
  const { asociadas: all, addAsociada } = useAsociadas();
  const items = filteredAsociadas || all;
  const [routeDest, setRouteDest] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [origin, setOrigin] = useState({ lat: 1.2035, lng: -76.9201 });
  const [tempPin, setTempPin] = useState(null);
  const [formCoords, setFormCoords] = useState(null);

  useEffect(() => {
    if (initialRouteDest) {
      setRouteDest(initialRouteDest);
      setRouteInfo(null);
    }
  }, [initialRouteDest]);

  const handleMapClick = useCallback((e) => {
    setTempPin({ lat: e.latlng.lat, lng: e.latlng.lng });
  }, []);

  const handleSave = useCallback((asociada) => {
    addAsociada(asociada);
  }, [addAsociada]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const destination = useMemo(
    () => (routeDest ? { lat: routeDest[0], lng: routeDest[1] } : null),
    [routeDest]
  );

  const handleRoute = useCallback((dest) => {
    setRouteDest((prev) => {
      if (prev && prev[0] === dest[0] && prev[1] === dest[1]) return null;
      return dest;
    });
    setRouteInfo(null);
  }, []);

  const handleCloseRoute = useCallback(() => {
    setRouteDest(null);
    setRouteInfo(null);
  }, []);

  const visibleMarkers = useMemo(() => {
    if (!routeDest) return items;
    const [dlat, dlng] = routeDest;
    return items.filter((a) => Math.abs(a.lat - dlat) < 0.0001 && Math.abs(a.lng - dlng) < 0.0001);
  }, [items, routeDest]);

  return (
    <div className="relative h-[calc(100dvh-8rem)] min-h-[400px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 lg:h-[600px]">
      {routeDest && (
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap gap-2">
          <button
            onClick={handleCloseRoute}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md border border-gray-200 transition-colors duration-200 hover:bg-gray-50 active:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
            Cerrar ruta
          </button>
          {routeInfo && (
            <div className="inline-flex items-center gap-3 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-md border border-gray-200 backdrop-blur-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Route className="h-4 w-4 text-blue-500" />
                {routeInfo.distance} km
              </span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                {formatDuration(routeInfo.duration)}
              </span>
              {routeInfo.approximate ? (
                <span className="flex items-center gap-1 text-amber-500 text-[10px] font-medium ml-1 animate-pulse">
                  <Loader className="h-3 w-3 animate-spin" />
                  optimizando...
                </span>
              ) : (
                <span className="text-emerald-500 text-[10px] font-medium ml-1">
                  ruta real
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <MapContainer
        center={[1.2035, -76.9201]}
        zoom={14}
        className="h-full w-full"
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!routeDest && <FitBounds puntos={items.map((a) => [a.lat, a.lng])} />}
        <ClickHandler onClick={handleMapClick} />
        {visibleMarkers.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]}>
            <Popup>
              <PopupContent asociada={a} onRoute={handleRoute} />
            </Popup>
          </Marker>
        ))}
        {routeDest && destination && (
          <RouteLayer
            key={`${routeDest[0].toFixed(5)}-${routeDest[1].toFixed(5)}`}
            destination={destination}
            origin={origin}
            onInfo={(info) => setRouteInfo(info)}
          />
        )}
        {tempPin && (
          <Marker position={[tempPin.lat, tempPin.lng]} icon={tempMarkerIcon}>
            <Popup>
              <div className="min-w-[140px] text-center">
                <p className="mb-3 text-xs font-medium text-gray-500">Nueva ubicación</p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFormCoords(tempPin); setTempPin(null); }}
                    className="flex-1 cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTempPin(null); }}
                    className="flex-1 cursor-pointer rounded-lg bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <button
        onClick={() => setFormCoords({ lat: origin.lat, lng: origin.lng })}
        className="absolute bottom-4 right-4 z-[1000] cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        <Crosshair className="h-4 w-4" />
        Mi ubicación
      </button>
      <FormularioAsociada
        open={!!formCoords}
        onClose={() => { setFormCoords(null); setTempPin(null); }}
        onSave={handleSave}
        coords={formCoords || { lat: 0, lng: 0 }}
      />
    </div>
  );
}

export default Mapa;
