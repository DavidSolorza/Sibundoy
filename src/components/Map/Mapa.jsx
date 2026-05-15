import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

function FitBounds({ asociadas }) {
  const map = useMap();
  useEffect(() => {
    if (asociadas.length > 0) {
      const bounds = L.latLngBounds(asociadas.map((a) => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [asociadas, map]);
  return null;
}

function RouteLayer({ destination, origin, onInfo }) {
  const map = useMap();
  const lineRef = useRef(null);
  const straightRef = useRef(null);
  const fetchedKey = useRef(null);

  useEffect(() => {
    if (!destination) return;

    const key = `${destination.lat.toFixed(5)}-${destination.lng.toFixed(5)}`;
    if (fetchedKey.current === key) return;
    fetchedKey.current = key;

    const straight = L.polyline(
      [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.4,
        dashArray: "8, 10",
      }
    ).addTo(map);
    straightRef.current = straight;

    map.fitBounds(straight.getBounds(), { padding: [60, 60] });

    let active = true;

    async function fetchRoute() {
      const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;

        if (data.code === "Ok" && data.routes.length > 0) {
          const route = data.routes[0];
          const coordsGeo = route.geometry.coordinates.map((c) => [c[1], c[0]]);

          if (straightRef.current) {
            map.removeLayer(straightRef.current);
            straightRef.current = null;
          }

          lineRef.current = L.polyline(coordsGeo, {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.85,
          }).addTo(map);

          if (active) {
            onInfo({
              distance: (route.distance / 1000).toFixed(1),
              duration: Math.round(route.duration / 60),
            });
          }
        }
      } catch {
        /* OSRM unavailable, keep straight line */
      }
    }

    fetchRoute();

    return () => {
      active = false;
      if (straightRef.current) map.removeLayer(straightRef.current);
      if (lineRef.current) map.removeLayer(lineRef.current);
    };
  }, [destination, origin, map, onInfo]);

  return null;
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
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
  }, []);

  const handleCloseRoute = useCallback(() => {
    setRouteDest(null);
    setRouteInfo(null);
  }, []);

  const handleInfo = useCallback((info) => {
    setRouteInfo(info);
    setLoading(false);
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
          {loading && !routeInfo && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-md border border-gray-200 text-gray-500 backdrop-blur-sm">
              Calculando ruta...
            </div>
          )}
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
        <FitBounds asociadas={items} />
        {items.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lng]}>
            <Popup>
              <PopupContent asociada={a} onRoute={handleRoute} />
            </Popup>
          </Marker>
        ))}
        {routeDest && destination && (
          <RouteLayer
            key={`${routeDest[0]}-${routeDest[1]}`}
            destination={destination}
            origin={origin}
            onInfo={handleInfo}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default Mapa;
