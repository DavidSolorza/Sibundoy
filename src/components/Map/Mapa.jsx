import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Sprout, Wheat, Navigation, X, User } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
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

function Routing({ destination }) {
  const map = useMap();

  useEffect(() => {
    if (!destination) return;

    const defaultStart = L.latLng(1.2035, -76.9201);
    const dest = L.latLng(destination[0], destination[1]);

    const control = L.Routing.control({
      waypoints: [defaultStart, dest],
      routeWhileDragging: true,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: "#3b82f6", weight: 5, opacity: 0.8 }],
      },
    }).addTo(map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          control.setWaypoints([
            L.latLng(pos.coords.latitude, pos.coords.longitude),
            dest,
          ]);
        },
        () => {}
      );
    }

    return () => map.removeControl(control);
  }, [destination, map]);

  return null;
}

function PopupContent({ asociada: a, onRoute }) {
  return (
    <div className="text-sm leading-relaxed min-w-[200px]">
      <p className="font-semibold text-base mb-2 flex items-center gap-1.5">
        <User className="h-4 w-4 text-blue-600" />
        {a.nombre}
      </p>
      <div className="space-y-1 text-gray-600 mb-3">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Sector:</span> {a.sector}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Tel:</span> {a.telefono}
        </p>
        <p className="flex items-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Huerta:</span> {a.areaHuerta}
        </p>
        <p className="flex items-center gap-1.5">
          <Wheat className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-400">Productos:</span> {a.productos}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRoute([a.lat, a.lng]);
        }}
        className="cursor-pointer w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700"
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

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
      {routeDest && (
        <button
          onClick={() => setRouteDest(null)}
          className="absolute top-3 right-3 z-[1000] cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md border border-gray-200 transition-colors duration-200 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          Cerrar ruta
        </button>
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
              <PopupContent asociada={a} onRoute={setRouteDest} />
            </Popup>
          </Marker>
        ))}
        {routeDest && <Routing destination={routeDest} />}
      </MapContainer>
    </div>
  );
}

export default Mapa;
