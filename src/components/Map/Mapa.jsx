import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Sprout, Wheat, Navigation, X, User, Clock, Route } from "lucide-react";
import "leaflet/dist/leaflet.css";
import useAsociadas from "../../hooks/useAsociadas";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [puntos, map]);
  return null;
}

function RouteLayer({ destination, origin, onInfo }) {
  const [coords, setCoords] = useState([]);
  const [isApprox, setIsApprox] = useState(false);
  const fetched = useRef(null);

  useEffect(() => {
    const key = `${destination.lat.toFixed(5)}-${destination.lng.toFixed(5)}`;
    if (fetched.current === key) return;
    fetched.current = key;

    const straight = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];
    setCoords(straight);
    setIsApprox(true);

    const distKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const tMin = Math.round(distKm * 2);
    onInfo({ distance: distKm.toFixed(1), duration: tMin, approximate: true });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

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
  }, [destination, origin, onInfo]);

  if (coords.length === 0) return null;

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
    <div className="text-sm leading-relaxed min-w-[180px] max-w-[220px]">
      <p className="font-semibold text-base mb-2 flex items-center gap-1.5">
        <User className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="truncate">{a.nombre}</span>
      </p>
      <div className="space-y-1 text-gray-600 mb-3">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Sector:</span> {a.sector}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Tel:</span> {a.telefono}
        </p>
        <p className="flex items-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Huerta:</span> {a.areaHuerta}
        </p>
        <p className="flex items-center gap-1.5">
          <Wheat className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-400">Productos:</span> {a.productos}
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
        C\u00f3mo llegar
      </button>
    </div>
  );
}

function Mapa({ filteredAsociadas }) {
  const { asociadas: all } = useAsociadas();
  const items = filteredAsociadas || all;
  const [routeDest, setRouteDest] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [origin, setOrigin] = useState({ lat: 1.2035, lng: -76.9201 });

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
                {routeInfo.duration} min
              </span>
              {routeInfo.approximate && (
                <span className="text-amber-500 text-[10px] font-medium ml-1">
                  (estimado)
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds puntos={items.map((a) => [a.lat, a.lng])} />
        {items.map((a) => (
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
      </MapContainer>
    </div>
  );
}

export default Mapa;
