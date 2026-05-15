import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Phone, Sprout, Wheat } from "lucide-react";
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

function PopupContent({ asociada: a }) {
  return (
    <div className="text-sm leading-relaxed min-w-[180px]">
      <p className="font-semibold text-base mb-2 flex items-center gap-1.5">
        <User className="h-4 w-4 text-blue-600" />
        {a.nombre}
      </p>
      <div className="space-y-1 text-gray-600">
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
    </div>
  );
}

import { User } from "lucide-react";

function Mapa({ filteredAsociadas }) {
  const { asociadas: all } = useAsociadas();
  const items = filteredAsociadas || all;

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
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
              <PopupContent asociada={a} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Mapa;
